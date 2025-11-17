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
    const { action, cartazData } = await req.json();
    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN');

    if (!mondayApiToken) {
      throw new Error('Monday.com API token não configurado');
    }

    // Usar o quadro fixo configurado
    const BOARD_ID = "7854209602";

    console.log('Enviando cartaz para Monday.com:', cartazData);

    // Buscar as colunas e grupos do quadro
    const boardQuery = `
      query {
        boards (ids: [${BOARD_ID}]) {
          columns {
            id
            title
            type
            settings_str
          }
          groups {
            id
            title
          }
        }
      }
    `;

    const boardInfoResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': mondayApiToken,
        'Content-Type': 'application/json',
        'API-Version': '2024-01'
      },
      body: JSON.stringify({
        query: boardQuery
      })
    });

    const boardInfo = await boardInfoResponse.json();
    console.log('Informações do board:', JSON.stringify(boardInfo, null, 2));
    
    if (boardInfo.errors) {
      console.error('Erro na API do Monday.com:', boardInfo.errors);
      throw new Error(`Erro do Monday.com: ${boardInfo.errors[0].message}`);
    }

    const columns = boardInfo.data?.boards?.[0]?.columns || [];
    const groups = boardInfo.data?.boards?.[0]?.groups || [];
    
    // Selecionar o primeiro grupo disponível
    const selectedGroupId = groups.length > 0 ? groups[0].id : undefined;
    
    // Mapear valores para as colunas corretas
    const columnValues: Record<string, any> = {};
    
    columns.forEach((col: any) => {
      const colId = col.id.toLowerCase().trim();
      
      switch(colId) {
        // enviar_arquivo__1 - receberá a vaga final em .png (será enviado depois via upload)
        
        // texto6__1 - codigo vaga
        case "texto6__1":
          if (cartazData.codigo) {
            columnValues[col.id] = cartazData.codigo;
          }
          break;
          
        // status0__1 - tipo de cartaz (tradicional, compilado, weg, marisa)
        case "status0__1":
          if (cartazData.modeloCartaz) {
            const tipoMap: Record<string, string> = {
              "padrao": "tradicional",
              "marisa": "marisa",
              "compilado-padrao": "compilado",
              "compilado-marisa": "compilado"
            };
            const tipo = tipoMap[cartazData.modeloCartaz] || "tradicional";
            if (col.type === "dropdown" || col.type === "color") {
              columnValues[col.id] = {"labels": [tipo]};
            } else {
              columnValues[col.id] = tipo;
            }
          }
          break;
          
        // status__1 - tipo de contrato
        case "status__1":
          if (cartazData.tipoContrato) {
            if (col.type === "dropdown" || col.type === "color") {
              columnValues[col.id] = {"labels": [cartazData.tipoContrato]};
            } else {
              columnValues[col.id] = cartazData.tipoContrato;
            }
          }
          break;
          
        // texto8__1 - cidade estado
        case "texto8__1":
          if (cartazData.local) {
            columnValues[col.id] = cartazData.local;
          }
          break;
          
        // texto_longo__1 - e-mail whatsapp caso informado
        case "texto_longo__1":
          if (cartazData.contato?.valor) {
            const contatoTexto = cartazData.contato.tipo 
              ? `${cartazData.contato.tipo}: ${cartazData.contato.valor}`
              : cartazData.contato.valor;
            columnValues[col.id] = contatoTexto;
          }
          break;
          
        // texto_longo9__1 - requisitos e atividades
        case "texto_longo9__1":
          if (cartazData.requisitos) {
            columnValues[col.id] = cartazData.requisitos;
          } else if (cartazData.atividades) {
            columnValues[col.id] = cartazData.atividades;
          } else if (cartazData.requisitos && cartazData.atividades) {
            columnValues[col.id] = `Requisitos: ${cartazData.requisitos}\n\nAtividades: ${cartazData.atividades}`;
          }
          break;
          
        // link__1 - link da vaga
        case "link__1":
          if (cartazData.linkVaga) {
            columnValues[col.id] = {
              "url": cartazData.linkVaga,
              "text": "Link da Vaga"
            };
          }
          break;
          
        // e_mail__1 - e-mail solicitante
        case "e_mail__1":
          if (cartazData.emailSolicitante) {
            columnValues[col.id] = {
              "email": cartazData.emailSolicitante,
              "text": cartazData.emailSolicitante
            };
          }
          break;
      }
    });

    console.log('Column values sendo enviados:', JSON.stringify(columnValues, null, 2));

    // Criar item no Monday.com
    const mutation = `
      mutation {
        create_item (
          board_id: ${BOARD_ID},
          ${selectedGroupId ? `group_id: "${selectedGroupId}",` : ''}
          item_name: "${cartazData.cargo || 'Cartaz'} - ${cartazData.local || ''}",
          column_values: ${JSON.stringify(JSON.stringify(columnValues))}
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
      
      try {
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

        // Encontrar a coluna de arquivo (enviar_arquivo__1)
        const fileColumn = columns.find((col: any) => col.id === "enviar_arquivo__1" || col.type === "file");
        
        if (fileColumn) {
          const uploadMutation = `
            mutation ($file: File!) {
              add_file_to_column (
                item_id: ${result.data.create_item.id},
                column_id: "${fileColumn.id}",
                file: $file
              ) {
                id
              }
            }
          `;

          const formData = new FormData();
          formData.append('query', uploadMutation);
          formData.append('variables', JSON.stringify({file: null}));
          formData.append('map', JSON.stringify({"1": ["variables.file"]}));
          formData.append('1', imageBlob, `cartaz-${cartazData.codigo}.png`);

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
      } catch (uploadError) {
        console.error('Erro no upload da imagem:', uploadError);
        // Não falhar o processo inteiro por causa do upload da imagem
      }
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