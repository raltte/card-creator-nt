import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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

    // Inserir solicitação no banco
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
        status: 'pendente_imagem'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir solicitação:', insertError);
      throw insertError;
    }

    console.log('Solicitação criada:', solicitacao);

    // Se skipMonday = true, retornar apenas o ID da solicitação
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

    // Gerar link de finalização usando a URL de origem do request
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || Deno.env.get('APP_URL') || 'https://jqpjcoitrmochijrgfbc.lovable.app';
    const finalizacaoUrl = `${origin}/finalizar/${solicitacao.id}`;
    
    console.log('Link de finalização gerado:', finalizacaoUrl);

    // Enviar para Monday.com
    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN');
    if (!mondayApiToken) {
      throw new Error('Monday.com API token não configurado');
    }

    const BOARD_ID = "7854209602";

    // Mapear valores para as colunas do Monday
    const columnValues: Record<string, any> = {
      "texto6__1": solicitacaoData.codigo, // código vaga
      "status0__1": { "labels": [getModeloLabel(solicitacaoData.modeloCartaz)] }, // tipo de cartaz
      "status__1": { "labels": [solicitacaoData.tipoContrato] }, // tipo de contrato
      "texto8__1": solicitacaoData.local || '', // cidade estado
      "texto_longo__1": solicitacaoData.contato?.valor 
        ? `${solicitacaoData.contato.tipo}: ${solicitacaoData.contato.valor}`
        : '', // e-mail whatsapp
      "texto_longo9__1": solicitacaoData.requisitos || solicitacaoData.atividades || '', // requisitos e atividades
      "link__1": {
        "url": finalizacaoUrl,
        "text": "Finalizar Cartaz"
      }, // link para finalização
      "e_mail__1": solicitacaoData.emailSolicitante 
        ? {
            "email": solicitacaoData.emailSolicitante,
            "text": solicitacaoData.emailSolicitante
          }
        : ''
    };

    // Criar item no Monday
    const createMutation = `
      mutation {
        create_item (
          board_id: ${BOARD_ID},
          item_name: "${solicitacaoData.cargo} - ${solicitacaoData.local || 'Local não especificado'}",
          column_values: ${JSON.stringify(JSON.stringify(columnValues))}
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

    // Atualizar solicitação com ID do Monday
    const mondayItemId = mondayResult.data?.create_item?.id;
    if (mondayItemId) {
      await supabase
        .from('solicitacoes_cartaz')
        .update({ monday_item_id: mondayItemId })
        .eq('id', solicitacao.id);
    }

    return new Response(JSON.stringify({
      success: true,
      solicitacaoId: solicitacao.id,
      mondayItemId: mondayItemId,
      finalizacaoUrl: finalizacaoUrl
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

function getModeloLabel(modelo: string): string {
  const map: Record<string, string> = {
    'padrao': 'tradicional',
    'marisa': 'marisa',
    'weg': 'weg',
    'compilado-padrao': 'compilado',
    'compilado-marisa': 'compilado'
  };
  return map[modelo] || 'tradicional';
}
