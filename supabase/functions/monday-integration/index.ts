import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { sanitizeItemName } from "../_shared/monday.ts";

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!mondayApiToken) {
      throw new Error('Monday.com API token não configurado');
    }

    // Usar o quadro fixo configurado
    const BOARD_ID = "7854209602";

    console.log('Enviando cartaz para Monday.com:', cartazData);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const modeloCartaz = cartazData.modeloCartaz || cartazData.clientTemplate || 'padrao';
    const tipoContrato = cartazData.tipoContrato || 'Efetivo';
    const codigo = String(cartazData.codigo || cartazData.codigoPS || '').trim();
    const cargo = String(cartazData.cargo || cartazData.nomeVaga || 'Cartaz').trim();
    const local = String(cartazData.local || [cartazData.cidade, cartazData.estado].filter(Boolean).join(' - ') || '').trim();
    const contato = cartazData.contato || null;
    const linkVaga = cartazData.linkVaga || (codigo ? `https://novotemporh.com.br/vagas/?search=${encodeURIComponent(codigo)}` : null);
    const validUserId = cartazData.userId && uuidRegex.test(cartazData.userId) ? cartazData.userId : null;

    const { data: solicitacao, error: insertError } = await supabase
      .from('solicitacoes_cartaz')
      .insert({
        codigo: codigo || `LEG-${Date.now()}`,
        cargo,
        tipo_contrato: tipoContrato,
        modelo_cartaz: modeloCartaz,
        local: local || null,
        contato_tipo: contato?.tipo || null,
        contato_valor: contato?.valor || null,
        requisitos: cartazData.requisitos || null,
        atividades: cartazData.atividades || null,
        link_vaga: linkVaga,
        email_solicitante: cartazData.emailSolicitante || null,
        is_pcd: cartazData.isPcd || false,
        status: 'pendente_imagem',
        user_id: validUserId,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Erro ao registrar solicitação antes do Monday:', insertError);
      throw insertError;
    }

    const origin = req.headers.get('origin')
      || req.headers.get('referer')?.split('/').slice(0, 3).join('/')
      || Deno.env.get('APP_URL')
      || 'https://novotemporh.raltte.com';
    const finalizacaoUrl = `${origin}/finalizar/${solicitacao.id}`;

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
          if (codigo) {
            columnValues[col.id] = codigo;
          }
          break;
          
        // status0__1 - tipo de cartaz (tradicional, compilado, weg, marisa)
        case "status0__1":
          if (modeloCartaz) {
            const tipoMap: Record<string, string> = {
              "padrao": "TRADICIONAL",
              "marisa": "Marisa",
              "weg": "WEG",
              "vaga-interna": "VAGA INTERNA",
              "dm-card": "DM",
              "compilado-padrao": "COMPILADO",
              "compilado-marisa": "Marisa COMPILADO",
              "tramasso": "TRAMASSOIDH"
            };
            const tipo = tipoMap[modeloCartaz] || "TRADICIONAL";
            columnValues[col.id] = { label: tipo };
          }
          break;
          
        // status__1 - tipo de contrato
        case "status__1":
          if (tipoContrato) {
            if (col.type === "dropdown" || col.type === "color") {
              columnValues[col.id] = {"labels": [tipoContrato]};
            } else {
              columnValues[col.id] = tipoContrato;
            }
          }
          break;
          
        // texto8__1 - cidade estado
        case "texto8__1":
          if (local) {
            columnValues[col.id] = local;
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
          
        // link__1 - link da vaga (gerado automaticamente com código)
        case "link__1":
          if (linkVaga) {
            columnValues[col.id] = {
              "url": linkVaga,
              "text": "Link da Vaga"
            };
          }
          break;

        // text_mkzwcjb9 - link de finalização
        case "text_mkzwcjb9":
          columnValues[col.id] = finalizacaoUrl;
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
            item_name: "${sanitizeItemName(`${cargo} - ${local || ''}`)}",
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

    const itemId = result.data?.create_item?.id;

    if (itemId) {
      await supabase
        .from('solicitacoes_cartaz')
        .update({ monday_item_id: itemId })
        .eq('id', solicitacao.id);
    }

    // Se há uma imagem, fazer upload como anexo
    if (cartazData.image && itemId) {
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
                item_id: ${itemId},
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
      itemId,
      solicitacaoId: solicitacao.id,
      finalizacaoUrl,
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