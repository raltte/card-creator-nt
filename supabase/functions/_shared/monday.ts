const MONDAY_API_URL = "https://api.monday.com/v2";

export type MondayColumn = {
  id: string;
  title?: string;
  type?: string;
  settings_str?: string | null;
};

type SolicitacaoLike = {
  codigo?: string | null;
  tipo_contrato?: string | null;
  modelo_cartaz?: string | null;
  local?: string | null;
  contato_tipo?: string | null;
  contato_valor?: string | null;
  requisitos?: string | null;
  atividades?: string | null;
  sugestao_imagem?: string | null;
  link_vaga?: string | null;
  email_solicitante?: string | null;
  finalizacao_url?: string | null;
};

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function parseSettings(column: MondayColumn) {
  if (!column.settings_str) return {} as Record<string, unknown>;

  try {
    return JSON.parse(column.settings_str) as Record<string, unknown>;
  } catch {
    return {} as Record<string, unknown>;
  }
}

function getStatusIndexByLabel(column: MondayColumn, desiredLabel: string): number | null {
  const settings = parseSettings(column);
  const labels = settings.labels;

  if (!labels || typeof labels !== "object") {
    return null;
  }

  const match = Object.entries(labels as Record<string, string>).find(([, label]) => {
    return normalizeLabel(String(label)) === normalizeLabel(desiredLabel);
  });

  return match ? Number(match[0]) : null;
}

export function sanitizeItemName(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function getModeloLabel(modelo: string | null | undefined): string {
  const map: Record<string, string> = {
    padrao: "TRADICIONAL",
    marisa: "Marisa",
    weg: "WEG",
    "vaga-interna": "VAGA INTERNA",
    "dm-card": "DM",
    "compilado-padrao": "COMPILADO",
    "compilado-marisa": "Marisa COMPILADO",
    // Mutirão usa label COMPILADO (board do Monday não tem label MUTIRÃO cadastrada)
    "mutirao-bombril": "COMPILADO",
    "mutirao-tradicional": "COMPILADO",
  };

  return map[modelo || ""] || "TRADICIONAL";
}

export function getContratoMondayLabel(tipoContrato: string | null | undefined): string {
  const map: Record<string, string> = {
    Efetivo: "Efetiva",
    Temporário: "Temporária",
    PJ: "PJ",
    Estágio: "Estágio",
    Terceirizado: "Terceirizada",
    Compilado: "Compilado",
  };

  return map[tipoContrato || ""] || (tipoContrato || "");
}

function resolveStatusValue(column: MondayColumn, desiredLabel: string) {
  const statusIndex = getStatusIndexByLabel(column, desiredLabel);

  if (statusIndex === null || Number.isNaN(statusIndex)) {
    // Em vez de quebrar a integração, manda o label e pede para o Monday criar se não existir
    console.warn(`Label "${desiredLabel}" não encontrada na coluna ${column.id} (${column.title || "sem título"}). Usando create_labels_if_missing.`);
    return { label: desiredLabel, create_labels_if_missing: true };
  }

  return { index: statusIndex };
}

export function buildSolicitacaoColumnValues(columns: MondayColumn[], solicitacao: SolicitacaoLike) {
  const columnValues: Record<string, unknown> = {};
  const modeloLabel = getModeloLabel(solicitacao.modelo_cartaz);
  const contratoLabel = getContratoMondayLabel(solicitacao.tipo_contrato);

  columns.forEach((col) => {
    const colId = col.id.toLowerCase().trim();

    switch (colId) {
      case "texto6__1":
        if (solicitacao.codigo) columnValues[col.id] = solicitacao.codigo;
        break;
      case "status0__1":
        columnValues[col.id] = resolveStatusValue(col, modeloLabel);
        break;
      case "status__1":
        // Compilado/Mutirão não são tipos de contrato válidos no board do Monday
        // (board aceita apenas: Efetiva, Estágio, Temporária, PJ, Terceirizada).
        // Nesses casos não enviamos a coluna de tipo de contrato.
        if (contratoLabel && contratoLabel !== "Compilado") {
          columnValues[col.id] = resolveStatusValue(col, contratoLabel);
        }
        break;
      case "texto8__1":
        if (solicitacao.local) columnValues[col.id] = solicitacao.local;
        break;
      case "texto_longo__1":
        if (solicitacao.contato_valor) {
          columnValues[col.id] = solicitacao.contato_tipo
            ? `${solicitacao.contato_tipo}: ${solicitacao.contato_valor}`
            : solicitacao.contato_valor;
        }
        break;
      case "texto_longo9__1": {
        const parts: string[] = [];
        if (solicitacao.requisitos) parts.push(`Requisitos: ${solicitacao.requisitos}`);
        if (solicitacao.atividades) parts.push(`Atividades: ${solicitacao.atividades}`);
        if (solicitacao.sugestao_imagem) parts.push(`Sugestão de imagem: ${solicitacao.sugestao_imagem}`);
        if (parts.length > 0) {
          columnValues[col.id] = parts.join('\n\n');
        }
        break;
      }
      case "link__1":
        if (solicitacao.link_vaga) {
          columnValues[col.id] = {
            url: solicitacao.link_vaga,
            text: "Link da Vaga",
          };
        }
        break;
      case "text_mkzwcjb9":
        if (solicitacao.finalizacao_url) {
          columnValues[col.id] = solicitacao.finalizacao_url;
        }
        break;
      case "e_mail__1":
        if (solicitacao.email_solicitante) {
          columnValues[col.id] = {
            email: solicitacao.email_solicitante,
            text: solicitacao.email_solicitante,
          };
        }
        break;
    }
  });

  return columnValues;
}

export async function mondayRequest<T = any>(token: string, query: string) {
  const response = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      "API-Version": "2024-01",
    },
    body: JSON.stringify({ query }),
  });

  return await response.json() as T;
}

export async function fetchBoardColumns(token: string, boardId: number | string) {
  const boardQuery = `
    query {
      boards (ids: [${boardId}]) {
        columns {
          id
          title
          type
          settings_str
        }
      }
    }
  `;

  const boardInfo = await mondayRequest<{ data?: { boards?: Array<{ columns?: MondayColumn[] }> }; errors?: Array<{ message: string }> }>(token, boardQuery);

  if (boardInfo.errors) {
    throw new Error(boardInfo.errors[0]?.message || "Erro ao buscar colunas do Monday");
  }

  return boardInfo.data?.boards?.[0]?.columns || [];
}

export async function updateMondayItemColumns(token: string, boardId: number | string, itemId: string | number, columnValues: Record<string, unknown>) {
  const mutation = `
    mutation {
      change_multiple_column_values(
        board_id: ${boardId},
        item_id: ${itemId},
        column_values: ${JSON.stringify(JSON.stringify(columnValues))}
      ) {
        id
      }
    }
  `;

  const result = await mondayRequest<{ data?: { change_multiple_column_values?: { id: string } }; errors?: Array<{ message: string }> }>(token, mutation);

  if (result.errors) {
    throw new Error(result.errors[0]?.message || "Erro ao atualizar colunas do item no Monday");
  }

  return result;
}

export async function verifyMondayItemLabels(token: string, itemId: string | number) {
  const query = `
    query {
      items (ids: [${itemId}]) {
        column_values(ids: ["status0__1", "status__1"]) {
          id
          text
        }
      }
    }
  `;

  const result = await mondayRequest<{ data?: { items?: Array<{ column_values?: Array<{ id: string; text: string | null }> }> }; errors?: Array<{ message: string }> }>(token, query);

  if (result.errors) {
    throw new Error(result.errors[0]?.message || "Erro ao validar colunas do item no Monday");
  }

  const values = result.data?.items?.[0]?.column_values || [];

  return {
    modelo: values.find((value) => value.id === "status0__1")?.text || null,
    contrato: values.find((value) => value.id === "status__1")?.text || null,
  };
}

export function labelsMatch(current: string | null, expected: string) {
  return current ? normalizeLabel(current) === normalizeLabel(expected) : false;
}
