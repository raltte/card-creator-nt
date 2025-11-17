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

    const { solicitacaoId } = await req.json();
    console.log('Atualizando link para solicitação:', solicitacaoId);

    // Buscar solicitação
    const { data: solicitacao, error: fetchError } = await supabase
      .from('solicitacoes_cartaz')
      .select('*')
      .eq('id', solicitacaoId)
      .single();

    if (fetchError || !solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    if (!solicitacao.monday_item_id) {
      throw new Error('Item do Monday não encontrado');
    }

    // Gerar novo link com APP_URL
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
    const novoLink = `${appUrl}/finalizar/${solicitacao.id}`;

    // Atualizar no Monday
    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN');
    if (!mondayApiToken) {
      throw new Error('Monday.com API token não configurado');
    }

    const updateMutation = `
      mutation {
        change_column_value (
          board_id: 7854209602,
          item_id: ${solicitacao.monday_item_id},
          column_id: "link__1",
          value: ${JSON.stringify(JSON.stringify({
            url: novoLink,
            text: "Finalizar Cartaz"
          }))}
        ) {
          id
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
      body: JSON.stringify({ query: updateMutation })
    });

    const mondayResult = await mondayResponse.json();
    console.log('Link atualizado no Monday:', mondayResult);

    if (mondayResult.errors) {
      throw new Error(`Erro do Monday.com: ${mondayResult.errors[0].message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      novoLink: novoLink
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
