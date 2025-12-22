-- Adicionar coluna is_pcd à tabela solicitacoes_cartaz
ALTER TABLE public.solicitacoes_cartaz 
ADD COLUMN is_pcd boolean NOT NULL DEFAULT false;