
-- Tabela de logos por cliente (banco reutilizável)
CREATE TABLE public.client_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  logo_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de logos de clientes"
  ON public.client_logos FOR SELECT
  USING (true);

CREATE POLICY "Inserção pública de logos de clientes"
  ON public.client_logos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Atualização pública de logos de clientes"
  ON public.client_logos FOR UPDATE
  USING (true);

CREATE TRIGGER update_client_logos_updated_at
  BEFORE UPDATE ON public.client_logos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_solicitacoes_updated_at();

-- Colunas em solicitacoes_cartaz
ALTER TABLE public.solicitacoes_cartaz
  ADD COLUMN cliente_nome text,
  ADD COLUMN cliente_slug text,
  ADD COLUMN cliente_logo_url text;

CREATE INDEX idx_solicitacoes_cliente_slug ON public.solicitacoes_cartaz(cliente_slug);

-- Bucket público para logos de clientes
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-logos', 'client-logos', true);

CREATE POLICY "Leitura pública de logos no storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-logos');

CREATE POLICY "Upload público de logos no storage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'client-logos');

CREATE POLICY "Update público de logos no storage"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'client-logos');
