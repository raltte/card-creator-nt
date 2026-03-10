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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const solicitacaoData = await req.json();
    console.log('Criando solicitação:', solicitacaoData);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUserId = solicitacaoData.userId && uuidRegex.test(solicitacaoData.userId)
      ? solicitacaoData.userId
      : null;

    const { data: solicitacao, error: insertError } = await supabase
      .from('solicitacoes_cartaz')
      .insert({
        codigo: solicitacaoData.codigo,
        cargo: solicitacaoData.cargo,
        tipo_contrato: solicitacaoData.tipoContrato,
        modelo_cartaz: solicitacaoData.modeloCartaz,
        local: solicitacaoData.local,
        contato_tipo: solicitacaoData.contato?.tipo,
        contato_valor: solicitacaoData.contato?.valor,
        requisitos: solicitacaoData.requisitos,
        atividades: solicitacaoData.atividades,
        link_vaga: solicitacaoData.linkVaga,
        email_solicitante: solicitacaoData.emailSolicitante,
        is_pcd: solicitacaoData.isPcd || false,
        status: 'pendente_imagem',
        user_id: validUserId
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir solicitação:', insertError);
      throw insertError;
    }

    console.log('Solicitação criada:', solicitacao);

    if (solicitacaoData.skipMonday) {
      return new Response(JSON.stringify({
        success: true,
        solicitacaoId: solicitacao.id,
        mondayItemId: null,
        finalizacaoUrl: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || Deno.env.get('APP_URL') || 'https://jqpjcoitrmochijrgfbc.lovable.app';
    const finalizacaoUrl = `${origin}/finalizar/${solicitacao.id}`;
    console.log('Link de finalização gerado:', finalizacaoUrl);

    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN');
    if (!mondayApiToken) {
      throw new Error('Monday.com API token não configurado');
    }

    const BOARD_ID = '7854209602';
    const columns = await fetchBoardColumns(mondayApiToken, BOARD_ID);
    const candidateUrl = `https://novotemporh.com.br/vagas/?search=${encodeURIComponent(solicitacao.codigo)}`;
    const columnValues = buildSolicitacaoColumnValues(columns, {
      ...solicitacao,
      link_vaga: solicitacao.link_vaga || candidateUrl,
      finalizacao_url: finalizacaoUrl,
    });

    console.log('Column values resolvidos:', JSON.stringify(columnValues, null, 2));

    const itemName = sanitizeItemName(`${solicitacao.cargo} - ${solicitacao.local || 'Local não especificado'}`);

    const createMutation = `
      mutation {
        create_item (
          board_id: ${BOARD_ID},
          item_name: "${itemName}"
        ) {
          id
          name
        }
      }
    `;

    const mondayResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': mondayApiToken,
        'Content-Type': 'application/json',
        'API-Version': '2024-01'
      },
      body: JSON.stringify({ query: createMutation })
    });

    const mondayResult = await mondayResponse.json();
    console.log('Resposta do Monday:', mondayResult);

    if (mondayResult.errors) {
      console.error('Erro no Monday:', mondayResult.errors);
      throw new Error(`Erro do Monday.com: ${mondayResult.errors[0].message}`);
    }

    const mondayItemId = mondayResult.data?.create_item?.id;
    if (!mondayItemId) {
      throw new Error('Falha ao obter o ID do item criado no Monday');
    }

    await updateMondayItemColumns(mondayApiToken, BOARD_ID, mondayItemId, columnValues);

    const verifiedValues = await verifyMondayItemLabels(mondayApiToken, mondayItemId);
    const expectedModelLabel = getModeloLabel(solicitacao.modelo_cartaz);

    console.log('Validação após criação:', {
      expectedModelLabel,
      actualModelLabel: verifiedValues.modelo,
      actualContractLabel: verifiedValues.contrato,
    });

    if (!labelsMatch(verifiedValues.modelo, expectedModelLabel)) {
      throw new Error(`Falha ao gravar o tipo de cartaz no Monday. Esperado: ${expectedModelLabel}. Atual: ${verifiedValues.modelo || 'vazio'}`);
    }

    await supabase
      .from('solicitacoes_cartaz')
      .update({ monday_item_id: mondayItemId })
      .eq('id', solicitacao.id);

    return new Response(JSON.stringify({
      success: true,
      solicitacaoId: solicitacao.id,
      mondayItemId,
      finalizacaoUrl
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
