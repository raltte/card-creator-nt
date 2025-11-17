-- Criar tabela para armazenar solicitações de cartazes
CREATE TABLE public.solicitacoes_cartaz (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL,
  cargo TEXT NOT NULL,
  tipo_contrato TEXT NOT NULL,
  modelo_cartaz TEXT NOT NULL,
  local TEXT,
  contato_tipo TEXT,
  contato_valor TEXT,
  requisitos TEXT,
  atividades TEXT,
  link_vaga TEXT,
  email_solicitante TEXT,
  monday_item_id TEXT,
  imagem_url TEXT,
  status TEXT DEFAULT 'pendente_imagem',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca rápida por ID do Monday
CREATE INDEX idx_solicitacoes_monday_item ON public.solicitacoes_cartaz(monday_item_id);

-- Índice para busca por status
CREATE INDEX idx_solicitacoes_status ON public.solicitacoes_cartaz(status);

-- RLS: Permitir leitura pública (necessário para o link funcionar)
ALTER TABLE public.solicitacoes_cartaz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de solicitações"
ON public.solicitacoes_cartaz
FOR SELECT
USING (true);

CREATE POLICY "Permitir atualização pública de solicitações"
ON public.solicitacoes_cartaz
FOR UPDATE
USING (true);

CREATE POLICY "Permitir inserção pública de solicitações"
ON public.solicitacoes_cartaz
FOR INSERT
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_solicitacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_solicitacoes_cartaz_updated_at
BEFORE UPDATE ON public.solicitacoes_cartaz
FOR EACH ROW
EXECUTE FUNCTION public.update_solicitacoes_updated_at();