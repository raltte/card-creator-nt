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

    // Normaliza o nome do cliente em slug e busca logo existente
    const slugify = (name: string): string =>
      name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const clienteNome = solicitacaoData.usaLogoCliente && solicitacaoData.clienteNome
      ? String(solicitacaoData.clienteNome).trim()
      : null;
    const clienteSlug = clienteNome ? slugify(clienteNome) : null;
    let clienteLogoUrl: string | null = null;
    if (clienteSlug) {
      const { data: existingLogo } = await supabase
        .from('client_logos')
        .select('logo_url')
        .eq('slug', clienteSlug)
        .maybeSingle();
      clienteLogoUrl = existingLogo?.logo_url || null;
    }

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
        user_id: validUserId,
        vagas_compilado: Array.isArray(solicitacaoData.vagasCompilado) && solicitacaoData.vagasCompilado.length > 0
          ? solicitacaoData.vagasCompilado
          : null,
        cliente_nome: clienteNome,
        cliente_slug: clienteSlug,
        cliente_logo_url: clienteLogoUrl
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

    let mondayItemId: string | null = null;
    let mondayWarning: string | null = null;

    try {
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
        sugestao_imagem: solicitacaoData.sugestaoImagem || null,
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
        throw new Error(`Erro do Monday.com: ${mondayResult.errors[0].message}`);
      }

      mondayItemId = mondayResult.data?.create_item?.id ?? null;
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
        console.warn(`Aviso: label do modelo no Monday divergente. Esperado: ${expectedModelLabel}. Atual: ${verifiedValues.modelo || 'vazio'}`);
      }

      await supabase
        .from('solicitacoes_cartaz')
        .update({ monday_item_id: mondayItemId })
        .eq('id', solicitacao.id);
    } catch (mondayError) {
      mondayWarning = mondayError instanceof Error ? mondayError.message : 'Erro desconhecido no Monday';
      console.error('Falha na integração Monday (solicitação ainda criada):', mondayWarning);
    }

    return new Response(JSON.stringify({
      success: true,
      solicitacaoId: solicitacao.id,
      mondayItemId,
      finalizacaoUrl,
      mondayWarning
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
