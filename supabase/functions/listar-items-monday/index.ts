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

    // Primeiro, buscar os grupos do board para encontrar o grupo "pedidos"
    const groupsQuery = `
      query {
        boards (ids: [${boardId}]) {
          groups {
            id
            title
          }
        }
      }
    `;

    const groupsResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': mondayApiToken,
        'Content-Type': 'application/json',
        'API-Version': '2024-01'
      },
      body: JSON.stringify({ query: groupsQuery })
    });

    const groupsResult = await groupsResponse.json();
    console.log('Groups response:', JSON.stringify(groupsResult, null, 2));

    if (groupsResult.errors) {
      throw new Error(groupsResult.errors[0]?.message || 'Erro ao buscar grupos do Monday');
    }

    const groups = groupsResult.data?.boards?.[0]?.groups || [];
    
    // Encontrar o grupo "pedidos" (case insensitive)
    const pedidosGroup = groups.find((g: any) => 
      g.title.toLowerCase() === 'pedidos'
    );

    if (!pedidosGroup) {
      console.log('Grupo "pedidos" não encontrado. Grupos disponíveis:', groups.map((g: any) => g.title));
      return new Response(JSON.stringify({
        success: true,
        items: [],
        groupId: null,
        message: 'Grupo "pedidos" não encontrado'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Grupo pedidos encontrado:', pedidosGroup);

    // Buscar items apenas do grupo "pedidos"
    const itemsQuery = `
      query {
        boards (ids: [${boardId}]) {
          groups (ids: ["${pedidosGroup.id}"]) {
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
      }
    `;

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': mondayApiToken,
        'Content-Type': 'application/json',
        'API-Version': '2024-01'
      },
      body: JSON.stringify({ query: itemsQuery })
    });

    const result = await response.json();
    console.log('Items response:', JSON.stringify(result, null, 2));

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Erro ao buscar items do Monday');
    }

    const items = result.data?.boards?.[0]?.groups?.[0]?.items_page?.items || [];

    // Mapear items para formato simples
    const mappedItems = items.map((item: any) => {
      // Buscar coluna de código
      const codigoCol = item.column_values.find((col: any) => 
        col.id === 'texto__1' || col.id === 'texto6__1' || col.id === 'codigo' || col.id.includes('codigo')
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
      items: mappedItems,
      groupId: pedidosGroup.id,
      groupTitle: pedidosGroup.title
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
