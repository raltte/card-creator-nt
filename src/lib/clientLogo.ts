/**
 * Normaliza o nome de um cliente em um slug estável para usar como chave única
 * na tabela client_logos. Remove acentos, baixa caixa e troca não-alfanuméricos por hífens.
 */
export const slugifyClient = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
