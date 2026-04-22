import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import {
  buildSolicitacaoColumnValues,
  fetchBoardColumns,
  sanitizeItemName,
  updateMondayItemColumns,
} from "../_shared/monday.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOARD_ID = '7854209602';

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
    if (!mondayApiToken) throw new Error('MONDAY_API_TOKEN não configurado');

    const body = await req.json().catch(() => ({}));
    const filtroModelos: string[] = body.modelos || ['mutirao-tradicional', 'mutirao-bombril'];

    const { data: pendentes, error } = await supabase
      .from('solicitacoes_cartaz')
      .select('*')
      .in('modelo_cartaz', filtroModelos)
      .is('monday_item_id', null);

    if (error) throw error;

    const columns = await fetchBoardColumns(mondayApiToken, BOARD_ID);
    const origin = req.headers.get('origin') || 'https://card-creator-nt.lovable.app';
    const resultados: any[] = [];

    for (const solicitacao of pendentes || []) {
      try {
        const finalizacaoUrl = `${origin}/finalizar/${solicitacao.id}`;
        const candidateUrl = `https://novotemporh.com.br/vagas/?search=${encodeURIComponent(solicitacao.codigo)}`;

        const columnValues = buildSolicitacaoColumnValues(columns, {
          ...solicitacao,
          link_vaga: solicitacao.link_vaga || candidateUrl,
          finalizacao_url: finalizacaoUrl,
        });

        const itemName = sanitizeItemName(`${solicitacao.cargo} - ${solicitacao.local || 'Local não especificado'}`);

        const createMutation = `
          mutation {
            create_item (board_id: ${BOARD_ID}, item_name: "${itemName}") {
              id
            }
          }
        `;

        const createResp = await fetch('https://api.monday.com/v2', {
          method: 'POST',
          headers: {
            'Authorization': mondayApiToken,
            'Content-Type': 'application/json',
            'API-Version': '2024-01',
          },
          body: JSON.stringify({ query: createMutation }),
        });
        const createJson = await createResp.json();
        if (createJson.errors) throw new Error(createJson.errors[0].message);

        const itemId = createJson.data?.create_item?.id;
        if (!itemId) throw new Error('Sem item_id retornado');

        await updateMondayItemColumns(mondayApiToken, BOARD_ID, itemId, columnValues);

        await supabase
          .from('solicitacoes_cartaz')
          .update({ monday_item_id: itemId })
          .eq('id', solicitacao.id);

        resultados.push({ id: solicitacao.id, codigo: solicitacao.codigo, mondayItemId: itemId, ok: true });
      } catch (err) {
        resultados.push({
          id: solicitacao.id,
          codigo: solicitacao.codigo,
          ok: false,
          erro: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return new Response(JSON.stringify({ total: pendentes?.length || 0, resultados }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
