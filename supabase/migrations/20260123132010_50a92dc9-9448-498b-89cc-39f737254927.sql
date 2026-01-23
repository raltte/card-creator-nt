-- Adicionar coluna user_id para rastrear o usuário autenticado que criou a solicitação
ALTER TABLE public.solicitacoes_cartaz 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Criar índice para melhor performance em queries por usuário
CREATE INDEX idx_solicitacoes_user_id ON public.solicitacoes_cartaz(user_id);

-- Comentário na coluna para documentação
COMMENT ON COLUMN public.solicitacoes_cartaz.user_id IS 'ID do usuário autenticado que criou a solicitação';