import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN');
    if (!mondayApiToken) {
      throw new Error('MONDAY_API_TOKEN não configurado');
    }

    const boardId = 7854209602;

    // Buscar items do board
    const query = `
      query {
        boards (ids: [${boardId}]) {
          items_page (limit: 100) {
            items {
              id
              name
              column_values {
                id
                text
                value
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': mondayApiToken,
        'Content-Type': 'application/json',
        'API-Version': '2024-01'
      },
      body: JSON.stringify({ query })
    });

    const result = await response.json();
    console.log('Monday response:', JSON.stringify(result, null, 2));

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Erro ao buscar items do Monday');
    }

    const items = result.data?.boards?.[0]?.items_page?.items || [];

    // Mapear items para formato simples
    const mappedItems = items.map((item: any) => {
      // Buscar coluna de código (provavelmente texto)
      const codigoCol = item.column_values.find((col: any) => 
        col.id === 'texto__1' || col.id === 'codigo' || col.id.includes('codigo')
      );
      const codigo = codigoCol?.text || '';

      return {
        id: item.id,
        name: item.name,
        codigo: codigo
      };
    });

    return new Response(JSON.stringify({
      success: true,
      items: mappedItems
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
