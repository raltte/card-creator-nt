import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import {
  buildSolicitacaoColumnValues,
  fetchBoardColumns,
  getModeloLabel,
  labelsMatch,
  sanitizeItemName,
  updateMondayItemColumns,
  verifyMondayItemLabels,
} from "../_shared/monday.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOARD_ID = 7854209602;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { solicitacaoId, imagemUrl, imagemBaseUrl, mondayItemId, createInGroupId } = await req.json();
    console.log('Finalizando cartaz:', { solicitacaoId, mondayItemId, createInGroupId });

    const { data: solicitacao, error: fetchError } = await supabase
      .from('solicitacoes_cartaz')
      .select('*')
      .eq('id', solicitacaoId)
      .single();

    if (fetchError || !solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN');
    if (!mondayApiToken) {
      throw new Error('MONDAY_API_TOKEN não configurado');
    }

    let imageBlob: Blob;
    if (imagemUrl.startsWith('data:')) {
      const response = await fetch(imagemUrl);
      imageBlob = await response.blob();
    } else {
      const imageResponse = await fetch(imagemUrl);
      imageBlob = await imageResponse.blob();
    }

    const columns = await fetchBoardColumns(mondayApiToken, BOARD_ID);
    const fileColumn = columns.find((col) => col.id === 'enviar_arquivo__1');

    const isMutirao = solicitacao.modelo_cartaz === 'mutirao-tradicional' || solicitacao.modelo_cartaz === 'mutirao-bombril';
    // Mutirões não têm link de vaga; demais modelos usam o link salvo ou geram a URL de busca
    const candidateUrl = isMutirao
      ? null
      : (solicitacao.link_vaga || `https://novotemporh.com.br/vagas/?search=${encodeURIComponent(solicitacao.codigo)}`);

    let targetItemId = mondayItemId || solicitacao.monday_item_id;
    const columnValues = buildSolicitacaoColumnValues(columns, {
      ...solicitacao,
      link_vaga: candidateUrl,
    });

    console.log('Column values para finalização:', JSON.stringify(columnValues, null, 2));

    if (createInGroupId && !targetItemId) {
      console.log('Criando novo item no grupo:', createInGroupId);

      const createMutation = `
        mutation {
          create_item (
            board_id: ${BOARD_ID},
            group_id: "${createInGroupId}",
            item_name: "${sanitizeItemName(`${solicitacao.cargo} - ${solicitacao.local || ''}`)}"
          ) {
            id
            name
          }
        }
      `;

      const createResponse = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Authorization': mondayApiToken,
          'Content-Type': 'application/json',
          'API-Version': '2024-01'
        },
        body: JSON.stringify({ query: createMutation })
      });

      const createResult = await createResponse.json();
      console.log('Resultado da criação do item:', JSON.stringify(createResult, null, 2));

      if (createResult.errors) {
        throw new Error(createResult.errors[0]?.message || 'Erro ao criar item no Monday');
      }

      targetItemId = createResult.data?.create_item?.id;

      if (!targetItemId) {
        throw new Error('Falha ao obter ID do novo item');
      }

      await supabase
        .from('solicitacoes_cartaz')
        .update({ monday_item_id: targetItemId })
        .eq('id', solicitacaoId);
    }

    if (!targetItemId) {
      throw new Error('Nenhum item do Monday especificado');
    }

    await updateMondayItemColumns(mondayApiToken, BOARD_ID, targetItemId, columnValues);

    const verifiedValues = await verifyMondayItemLabels(mondayApiToken, targetItemId);
    const expectedModelLabel = getModeloLabel(solicitacao.modelo_cartaz);

    console.log('Validação após finalização:', {
      expectedModelLabel,
      actualModelLabel: verifiedValues.modelo,
      actualContractLabel: verifiedValues.contrato,
    });

    if (!labelsMatch(verifiedValues.modelo, expectedModelLabel)) {
      throw new Error(`Falha ao atualizar o tipo de cartaz no Monday. Esperado: ${expectedModelLabel}. Atual: ${verifiedValues.modelo || 'vazio'}`);
    }

    if (fileColumn) {
      const uploadMutation = `
        mutation ($file: File!) {
          add_file_to_column (
            item_id: ${targetItemId},
            column_id: "${fileColumn.id}",
            file: $file
          ) {
            id
          }
        }
      `;

      const formData = new FormData();
      formData.append('query', uploadMutation);
      formData.append('variables', JSON.stringify({ file: null }));
      formData.append('map', JSON.stringify({ '1': ['variables.file'] }));
      formData.append('1', imageBlob, `cartaz-${solicitacao.codigo}.png`);

      const uploadResponse = await fetch('https://api.monday.com/v2/file', {
        method: 'POST',
        headers: {
          'Authorization': mondayApiToken,
        },
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      console.log('Upload realizado:', uploadResult);

      if (uploadResult.errors) {
        console.error('Erro no upload:', uploadResult.errors);
      }
    }

    const updateData: Record<string, any> = {
      imagem_url: imagemUrl,
      status: 'concluido',
      monday_item_id: targetItemId
    };
    if (imagemBaseUrl) {
      updateData.imagem_base_url = imagemBaseUrl;
    }

    const { error: updateError } = await supabase
      .from('solicitacoes_cartaz')
      .update(updateData)
      .eq('id', solicitacaoId);

    if (updateError) {
      console.error('Erro ao atualizar solicitação:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Cartaz finalizado com sucesso!',
      mondayItemId: targetItemId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
