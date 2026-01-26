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

    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN');
    if (!mondayApiToken) {
      throw new Error('Monday.com API token não configurado');
    }

    // Buscar solicitações com monday_item_id e user_id, mas sem email
    const { data: solicitacoes, error: fetchError } = await supabase
      .from('solicitacoes_cartaz')
      .select('id, monday_item_id, user_id, email_solicitante')
      .not('monday_item_id', 'is', null)
      .is('email_solicitante', null)
      .not('user_id', 'is', null);

    if (fetchError) {
      console.error('Erro ao buscar solicitações:', fetchError);
      throw fetchError;
    }

    console.log(`Encontradas ${solicitacoes?.length || 0} solicitações para atualizar`);

    const results: { success: number; failed: number; details: any[] } = {
      success: 0,
      failed: 0,
      details: []
    };

    for (const solicitacao of solicitacoes || []) {
      try {
        // Buscar email do usuário na tabela auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          solicitacao.user_id
        );

        if (userError || !userData?.user?.email) {
          console.log(`Não foi possível obter email para user_id: ${solicitacao.user_id}`);
          results.details.push({
            id: solicitacao.id,
            monday_item_id: solicitacao.monday_item_id,
            status: 'skipped',
            reason: 'Email não encontrado'
          });
          continue;
        }

        const userEmail = userData.user.email;
        console.log(`Atualizando item ${solicitacao.monday_item_id} com email: ${userEmail}`);

        // Atualizar no Monday.com
        const columnValues = {
          "e_mail__1": {
            "email": userEmail,
            "text": userEmail
          }
        };

        const mutation = `
          mutation {
            change_multiple_column_values(
              board_id: 7854209602,
              item_id: ${solicitacao.monday_item_id},
              column_values: ${JSON.stringify(JSON.stringify(columnValues))}
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
          body: JSON.stringify({ query: mutation })
        });

        const mondayResult = await mondayResponse.json();

        if (mondayResult.errors) {
          console.error(`Erro no Monday para item ${solicitacao.monday_item_id}:`, mondayResult.errors);
          results.failed++;
          results.details.push({
            id: solicitacao.id,
            monday_item_id: solicitacao.monday_item_id,
            status: 'failed',
            error: mondayResult.errors[0]?.message
          });
          continue;
        }

        // Atualizar email_solicitante no banco local
        await supabase
          .from('solicitacoes_cartaz')
          .update({ email_solicitante: userEmail })
          .eq('id', solicitacao.id);

        results.success++;
        results.details.push({
          id: solicitacao.id,
          monday_item_id: solicitacao.monday_item_id,
          email: userEmail,
          status: 'success'
        });

        console.log(`Item ${solicitacao.monday_item_id} atualizado com sucesso`);

      } catch (itemError) {
        console.error(`Erro ao processar item ${solicitacao.id}:`, itemError);
        results.failed++;
        results.details.push({
          id: solicitacao.id,
          monday_item_id: solicitacao.monday_item_id,
          status: 'error',
          error: itemError instanceof Error ? itemError.message : 'Erro desconhecido'
        });
      }
    }

    return new Response(JSON.stringify({
      message: `Processamento concluído: ${results.success} sucessos, ${results.failed} falhas`,
      ...results
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
