import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cartazData, boardId, groupId } = await req.json();
    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN');

    if (!mondayApiToken) {
      throw new Error('Monday.com API token não configurado');
    }

    console.log('Enviando cartaz para Monday.com:', cartazData);

    // Criar item no Monday.com
    const mutation = `
      mutation {
        create_item (
          board_id: ${boardId},
          group_id: "${groupId}",
          item_name: "${cartazData.cargo} - ${cartazData.local}",
          column_values: "${JSON.stringify({
            "text": cartazData.codigo,
            "text0": cartazData.tipoContrato,
            "text1": cartazData.local,
            "long_text": cartazData.requisitos.replace(/"/g, '\\"'),
            "text3": cartazData.contato.tipo,
            "text4": cartazData.contato.valor
          }).replace(/"/g, '\\"')}"
        ) {
          id
          name
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
      body: JSON.stringify({
        query: mutation
      })
    });

    const result = await response.json();
    console.log('Resposta do Monday.com:', result);

    if (result.errors) {
      console.error('Erro na API do Monday.com:', result.errors);
      throw new Error(`Erro do Monday.com: ${result.errors[0].message}`);
    }

    // Se há uma imagem, fazer upload como anexo
    if (cartazData.image && result.data?.create_item?.id) {
      console.log('Fazendo upload da imagem do cartaz...');
      
      // Converter base64 para blob se necessário
      let imageBlob: Blob;
      if (cartazData.image.startsWith('data:')) {
        const response = await fetch(cartazData.image);
        imageBlob = await response.blob();
      } else {
        // Se for URL, fazer download da imagem
        const imageResponse = await fetch(cartazData.image);
        imageBlob = await imageResponse.blob();
      }

      // Criar FormData para upload
      const formData = new FormData();
      formData.append('query', `
        mutation {
          add_file_to_column (
            item_id: ${result.data.create_item.id},
            column_id: "files",
            file: null
          ) {
            id
          }
        }
      `);
      formData.append('map', JSON.stringify({ "file": ["variables.file"] }));
      formData.append('file', imageBlob, `cartaz-${cartazData.codigo}.png`);

      const uploadResponse = await fetch('https://api.monday.com/v2/file', {
        method: 'POST',
        headers: {
          'Authorization': mondayApiToken,
        },
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      console.log('Resultado do upload da imagem:', uploadResult);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      itemId: result.data?.create_item?.id,
      message: 'Cartaz enviado para Monday.com com sucesso!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na integração com Monday.com:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});