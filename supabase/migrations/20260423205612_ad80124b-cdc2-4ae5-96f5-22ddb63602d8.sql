ALTER TABLE public.solicitacoes_cartaz
ADD COLUMN IF NOT EXISTS vagas_compilado jsonb;

COMMENT ON COLUMN public.solicitacoes_cartaz.vagas_compilado IS 'Array de objetos {codigo, cargo} para cartazes compilados (que podem ter múltiplas vagas).';