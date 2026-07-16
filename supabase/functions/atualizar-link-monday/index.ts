import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { updateMondayItemColumns } from "../_shared/monday.ts";

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

    const body = await req.json().catch(() => ({}));
    const { solicitacaoId, modelos } = body as { solicitacaoId?: string; modelos?: string[] };

    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN');
    if (!mondayApiToken) throw new Error('MONDAY_API_TOKEN não configurado');

    // Suporta modo unitário (solicitacaoId) ou em lote (modelos: [])
    let query = supabase
      .from('solicitacoes_cartaz')
      .select('id, monday_item_id, modelo_cartaz')
      .not('monday_item_id', 'is', null);

    if (solicitacaoId) {
      query = query.eq('id', solicitacaoId);
    } else if (Array.isArray(modelos) && modelos.length > 0) {
      query = query.in('modelo_cartaz', modelos);
    } else {
      throw new Error('Informe solicitacaoId ou modelos[]');
    }

    const { data: registros, error: fetchError } = await query;
    if (fetchError) throw fetchError;
    if (!registros || registros.length === 0) {
      return new Response(JSON.stringify({ success: true, total: 0, resultados: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const origin = req.headers.get('origin')
      || req.headers.get('referer')?.split('/').slice(0, 3).join('/')
      || Deno.env.get('APP_URL')
      || 'https://novotemporh.raltte.com';

    const resultados: any[] = [];
    for (const reg of registros) {
      try {
        const novoLink = `${origin}/finalizar/${reg.id}`;
        await updateMondayItemColumns(mondayApiToken, BOARD_ID, reg.monday_item_id!, {
          text_mkzwcjb9: novoLink,
        });
        resultados.push({ id: reg.id, mondayItemId: reg.monday_item_id, link: novoLink, ok: true });
      } catch (err) {
        resultados.push({
          id: reg.id,
          mondayItemId: reg.monday_item_id,
          ok: false,
          erro: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const primeiro = resultados[0];
    return new Response(JSON.stringify({
      success: true,
      total: registros.length,
      resultados,
      // Backwards-compat: quando chamado com um único solicitacaoId
      novoLink: primeiro?.ok ? primeiro.link : undefined,
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
