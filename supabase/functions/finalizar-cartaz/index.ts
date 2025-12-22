import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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

    const { solicitacaoId, imagemUrl, mondayItemId, createInGroupId } = await req.json();
    console.log('Finalizando cartaz:', { solicitacaoId, mondayItemId, createInGroupId });

    // Buscar solicitação
    const { data: solicitacao, error: fetchError } = await supabase
      .from('solicitacoes_cartaz')
      .select('*')
      .eq('id', solicitacaoId)
      .single();

    if (fetchError || !solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN');
    if (!mondayApiToken) {
      throw new Error('MONDAY_API_TOKEN não configurado');
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

    // Buscar colunas do board
    const boardQuery = `
      query {
        boards (ids: [${BOARD_ID}]) {
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

    let targetItemId = mondayItemId || solicitacao.monday_item_id;

    // Se createInGroupId foi fornecido, criar novo item no grupo
    if (createInGroupId && !targetItemId) {
      console.log('Criando novo item no grupo:', createInGroupId);

      // Preparar valores das colunas
      const columnValues: Record<string, any> = {};
      
      columns.forEach((col: any) => {
        const colId = col.id.toLowerCase().trim();
        
        switch(colId) {
          case "texto6__1":
            if (solicitacao.codigo) {
              columnValues[col.id] = solicitacao.codigo;
            }
            break;
          case "status0__1":
            const tipoMap: Record<string, string> = {
              "padrao": "tradicional",
              "marisa": "marisa",
              "weg": "weg",
              "compilado-padrao": "compilado",
              "compilado-marisa": "compilado"
            };
            const tipo = tipoMap[solicitacao.modelo_cartaz] || "tradicional";
            if (col.type === "dropdown" || col.type === "color") {
              columnValues[col.id] = {"labels": [tipo]};
            } else {
              columnValues[col.id] = tipo;
            }
            break;
          case "status__1":
            if (solicitacao.tipo_contrato) {
              if (col.type === "dropdown" || col.type === "color") {
                columnValues[col.id] = {"labels": [solicitacao.tipo_contrato]};
              } else {
                columnValues[col.id] = solicitacao.tipo_contrato;
              }
            }
            break;
          case "texto8__1":
            if (solicitacao.local) {
              columnValues[col.id] = solicitacao.local;
            }
            break;
          case "texto_longo__1":
            if (solicitacao.contato_valor) {
              const contatoTexto = solicitacao.contato_tipo 
                ? `${solicitacao.contato_tipo}: ${solicitacao.contato_valor}`
                : solicitacao.contato_valor;
              columnValues[col.id] = contatoTexto;
            }
            break;
          case "texto_longo9__1":
            if (solicitacao.requisitos && solicitacao.atividades) {
              columnValues[col.id] = `Requisitos: ${solicitacao.requisitos}\n\nAtividades: ${solicitacao.atividades}`;
            } else if (solicitacao.requisitos) {
              columnValues[col.id] = solicitacao.requisitos;
            } else if (solicitacao.atividades) {
              columnValues[col.id] = solicitacao.atividades;
            }
            break;
          case "link__1":
            if (solicitacao.link_vaga) {
              columnValues[col.id] = {
                "url": solicitacao.link_vaga,
                "text": "Link da Vaga"
              };
            }
            break;
          case "e_mail__1":
            if (solicitacao.email_solicitante) {
              columnValues[col.id] = {
                "email": solicitacao.email_solicitante,
                "text": solicitacao.email_solicitante
              };
            }
            break;
        }
      });

      console.log('Column values para novo item:', JSON.stringify(columnValues, null, 2));

      const createMutation = `
        mutation {
          create_item (
            board_id: ${BOARD_ID},
            group_id: "${createInGroupId}",
            item_name: "${solicitacao.cargo} - ${solicitacao.local || ''}",
            column_values: ${JSON.stringify(JSON.stringify(columnValues))}
          ) {
            id
            name
          }
        }
      `;

      const createResponse = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Authorization': mondayApiToken,
          'Content-Type': 'application/json',
          'API-Version': '2024-01'
        },
        body: JSON.stringify({ query: createMutation })
      });

      const createResult = await createResponse.json();
      console.log('Resultado da criação do item:', JSON.stringify(createResult, null, 2));

      if (createResult.errors) {
        throw new Error(createResult.errors[0]?.message || 'Erro ao criar item no Monday');
      }

      targetItemId = createResult.data?.create_item?.id;

      if (!targetItemId) {
        throw new Error('Falha ao obter ID do novo item');
      }

      // Atualizar a solicitação com o novo monday_item_id
      await supabase
        .from('solicitacoes_cartaz')
        .update({ monday_item_id: targetItemId })
        .eq('id', solicitacaoId);
    }

    if (!targetItemId) {
      throw new Error('Nenhum item do Monday especificado');
    }

    // Fazer upload da imagem no item
    if (fileColumn) {
      const uploadMutation = `
        mutation ($file: File!) {
          add_file_to_column (
            item_id: ${targetItemId},
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

      if (uploadResult.errors) {
        console.error('Erro no upload:', uploadResult.errors);
      }
    }

    // Atualizar solicitação com a imagem e status
    const { error: updateError } = await supabase
      .from('solicitacoes_cartaz')
      .update({
        imagem_url: imagemUrl,
        status: 'concluido',
        monday_item_id: targetItemId
      })
      .eq('id', solicitacaoId);

    if (updateError) {
      console.error('Erro ao atualizar solicitação:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Cartaz finalizado com sucesso!',
      mondayItemId: targetItemId
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
