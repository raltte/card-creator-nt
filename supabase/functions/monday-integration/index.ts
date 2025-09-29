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
    const { action, cartazData, boardId, groupId } = await req.json();
    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN');

    if (!mondayApiToken) {
      throw new Error('Monday.com API token não configurado');
    }

    // Se a ação for criar quadro
    if (action === 'create_board') {
      console.log('Criando quadro de aprovação de cartazes no Monday.com');
      
      const createBoardMutation = `
        mutation {
          create_board (
            board_name: "Aprovação de Cartazes - Novo Tempo RH",
            board_kind: private,
            description: "Quadro para aprovação de cartazes de vagas gerados automaticamente"
          ) {
            id
            name
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
        body: JSON.stringify({
          query: createBoardMutation
        })
      });

      const boardResult = await boardResponse.json();
      console.log('Quadro criado:', boardResult);

      if (boardResult.errors) {
        throw new Error(`Erro ao criar quadro: ${boardResult.errors[0].message}`);
      }

      const newBoardId = boardResult.data.create_board.id;

      // Criar colunas personalizadas
      const columns = [
        {
          title: "Status",
          column_type: "color",
          defaults: `{"labels":{"0":"Pendente","1":"Aprovado","11":"Rejeitado","14":"Em Revisão"}}`
        },
        {
          title: "Código PS",
          column_type: "text"
        },
        {
          title: "Tipo Contrato",
          column_type: "dropdown",
          defaults: `{"labels":{"1":"Efetivo","2":"Temporário","3":"Estágio","4":"PCD","5":"Freelancer"}}`
        },
        {
          title: "Local",
          column_type: "text"
        },
        {
          title: "Contato",
          column_type: "text"
        },
        {
          title: "Tipo Contato",
          column_type: "dropdown",
          defaults: `{"labels":{"1":"WhatsApp","2":"Email","3":"Site"}}`
        },
        {
          title: "Requisitos",
          column_type: "long_text"
        },
        {
          title: "Cartaz",
          column_type: "file"
        },
        {
          title: "Data Criação",
          column_type: "date"
        }
      ];

      // Criar cada coluna
      for (const column of columns) {
        const createColumnMutation = `
          mutation {
            create_column (
              board_id: ${newBoardId},
              title: "${column.title}",
              column_type: ${column.column_type}
              ${column.defaults ? `, defaults: "${column.defaults.replace(/"/g, '\\"')}"` : ''}
            ) {
              id
              title
            }
          }
        `;

        await fetch('https://api.monday.com/v2', {
          method: 'POST',
          headers: {
            'Authorization': mondayApiToken,
            'Content-Type': 'application/json',
            'API-Version': '2024-01'
          },
          body: JSON.stringify({
            query: createColumnMutation
          })
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        boardId: newBoardId,
        message: 'Quadro de aprovação criado com sucesso!'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ação de enviar cartaz
    console.log('Enviando cartaz para Monday.com:', cartazData);

    // Buscar as colunas do quadro para mapear corretamente
    const boardQuery = `
      query {
        boards (ids: [${boardId}]) {
          columns {
            id
            title
            type
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
    const columns = boardInfo.data?.boards?.[0]?.columns || [];
    
    // Mapear valores para as colunas corretas
    const columnValues: any = {};
    
    columns.forEach((col: any) => {
      switch(col.title) {
        case "Status":
          columnValues[col.id] = {"label": 0}; // Pendente
          break;
        case "Código PS":
          columnValues[col.id] = cartazData.codigo;
          break;
        case "Tipo Contrato":
          const contratoMap: any = {"Efetivo": 1, "Temporário": 2, "Estágio": 3, "PCD": 4, "Freelancer": 5};
          columnValues[col.id] = {"label": contratoMap[cartazData.tipoContrato] || 1};
          break;
        case "Local":
          columnValues[col.id] = cartazData.local;
          break;
        case "Contato":
          columnValues[col.id] = cartazData.contato.valor;
          break;
        case "Tipo Contato":
          const contatoMap: any = {"whatsapp": 1, "email": 2, "site": 3};
          columnValues[col.id] = {"label": contatoMap[cartazData.contato.tipo] || 3};
          break;
        case "Requisitos":
          columnValues[col.id] = cartazData.requisitos;
          break;
        case "Data Criação":
          columnValues[col.id] = {"date": new Date().toISOString().split('T')[0]};
          break;
      }
    });

    // Criar item no Monday.com
    const mutation = `
      mutation {
        create_item (
          board_id: ${boardId},
          ${groupId ? `group_id: "${groupId}",` : ''}
          item_name: "${cartazData.cargo} - ${cartazData.local}",
          column_values: "${JSON.stringify(columnValues).replace(/"/g, '\\"')}"
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

        // Encontrar a coluna de arquivo
        const fileColumn = columns.find((col: any) => col.title === "Cartaz" || col.type === "file");
        
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