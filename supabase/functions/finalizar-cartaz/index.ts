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

    const { solicitacaoId, imagemUrl } = await req.json();
    console.log('Finalizando cartaz:', { solicitacaoId, imagemUrl });

    // Buscar solicitação
    const { data: solicitacao, error: fetchError } = await supabase
      .from('solicitacoes_cartaz')
      .select('*')
      .eq('id', solicitacaoId)
      .single();

    if (fetchError || !solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    // Atualizar solicitação com a imagem
    const { error: updateError } = await supabase
      .from('solicitacoes_cartaz')
      .update({
        imagem_url: imagemUrl,
        status: 'concluido'
      })
      .eq('id', solicitacaoId);

    if (updateError) {
      throw updateError;
    }

    // Fazer upload da imagem no Monday
    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN');
    if (!mondayApiToken || !solicitacao.monday_item_id) {
      throw new Error('Configuração do Monday incompleta');
    }

    // Converter base64 para blob
    let imageBlob: Blob;
    if (imagemUrl.startsWith('data:')) {
      const response = await fetch(imagemUrl);
      imageBlob = await response.blob();
    } else {
      const imageResponse = await fetch(imagemUrl);
      imageBlob = await imageResponse.blob();
    }

    // Buscar colunas do board para encontrar enviar_arquivo__1
    const boardQuery = `
      query {
        boards (ids: [7854209602]) {
          columns {
            id
            title
            type
          }
        }
      }
    `;

    const boardResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': mondayApiToken,
        'Content-Type': 'application/json',
        'API-Version': '2024-01'
      },
      body: JSON.stringify({ query: boardQuery })
    });

    const boardInfo = await boardResponse.json();
    const columns = boardInfo.data?.boards?.[0]?.columns || [];
    const fileColumn = columns.find((col: any) => col.id === "enviar_arquivo__1");

    if (fileColumn) {
      const uploadMutation = `
        mutation ($file: File!) {
          add_file_to_column (
            item_id: ${solicitacao.monday_item_id},
            column_id: "${fileColumn.id}",
            file: $file
          ) {
            id
          }
        }
      `;

      const formData = new FormData();
      formData.append('query', uploadMutation);
      formData.append('variables', JSON.stringify({ file: null }));
      formData.append('map', JSON.stringify({ "1": ["variables.file"] }));
      formData.append('1', imageBlob, `cartaz-${solicitacao.codigo}.png`);

      const uploadResponse = await fetch('https://api.monday.com/v2/file', {
        method: 'POST',
        headers: {
          'Authorization': mondayApiToken,
        },
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      console.log('Upload realizado:', uploadResult);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Cartaz finalizado com sucesso!'
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
