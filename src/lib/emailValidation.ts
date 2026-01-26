// Lista de domínios corporativos permitidos
export const ALLOWED_DOMAINS = [
  'novotemporh.com.br',
  'novotempo-rh.com.br',
  'tramassoidh.com.br'
];

/**
 * Verifica se o email pertence a um domínio corporativo permitido
 */
export const isAllowedEmail = (email: string): boolean => {
  if (!email) return false;
  
  const emailLower = email.toLowerCase().trim();
  const domain = emailLower.split('@')[1];
  
  if (!domain) return false;
  
  return ALLOWED_DOMAINS.some(allowed => domain === allowed);
};

/**
 * Retorna mensagem de erro para email não permitido
 */
export const getEmailDomainError = (): string => {
  const domains = ALLOWED_DOMAINS.map(d => `@${d}`).join(', ');
  return `Apenas emails corporativos são permitidos: ${domains}`;
};
