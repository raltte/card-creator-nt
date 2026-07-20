
-- solicitacoes_cartaz: tighten write policies
DROP POLICY IF EXISTS "Permitir inserção pública de solicitações" ON public.solicitacoes_cartaz;
DROP POLICY IF EXISTS "Permitir atualização pública de solicitações" ON public.solicitacoes_cartaz;

CREATE POLICY "Usuários autenticados podem inserir solicitações"
  ON public.solicitacoes_cartaz FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar solicitações"
  ON public.solicitacoes_cartaz FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE ON public.solicitacoes_cartaz FROM anon;
GRANT SELECT ON public.solicitacoes_cartaz TO anon;
GRANT SELECT, INSERT, UPDATE ON public.solicitacoes_cartaz TO authenticated;
GRANT ALL ON public.solicitacoes_cartaz TO service_role;

-- client_logos: tighten write policies
DROP POLICY IF EXISTS "Inserção pública de logos de clientes" ON public.client_logos;
DROP POLICY IF EXISTS "Atualização pública de logos de clientes" ON public.client_logos;

CREATE POLICY "Usuários autenticados podem inserir logos de clientes"
  ON public.client_logos FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar logos de clientes"
  ON public.client_logos FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE ON public.client_logos FROM anon;
GRANT SELECT ON public.client_logos TO anon;
GRANT SELECT, INSERT, UPDATE ON public.client_logos TO authenticated;
GRANT ALL ON public.client_logos TO service_role;

-- storage: client-logos bucket policies
DROP POLICY IF EXISTS "Leitura pública de logos no storage" ON storage.objects;
DROP POLICY IF EXISTS "Upload público de logos no storage" ON storage.objects;
DROP POLICY IF EXISTS "Update público de logos no storage" ON storage.objects;

-- No SELECT policy on storage.objects for this bucket: bucket is public so files
-- remain accessible via direct public URL (getPublicUrl), but the bucket cannot
-- be listed by clients.

CREATE POLICY "Autenticados podem enviar logos no storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-logos');

CREATE POLICY "Autenticados podem atualizar logos no storage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'client-logos')
  WITH CHECK (bucket_id = 'client-logos');

-- Security definer functions: revoke EXECUTE from anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
