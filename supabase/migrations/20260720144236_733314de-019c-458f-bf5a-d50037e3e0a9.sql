
-- solicitacoes_cartaz
DROP POLICY IF EXISTS "Usuários autenticados podem inserir solicitações" ON public.solicitacoes_cartaz;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar solicitações" ON public.solicitacoes_cartaz;

CREATE POLICY "Autenticados criam suas solicitações"
  ON public.solicitacoes_cartaz FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Dono ou editor/admin atualiza solicitação"
  ON public.solicitacoes_cartaz FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'editor')
    OR public.has_role(auth.uid(), 'admin_master')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'editor')
    OR public.has_role(auth.uid(), 'admin_master')
  );

-- client_logos: only editor/admin can write
DROP POLICY IF EXISTS "Usuários autenticados podem inserir logos de clientes" ON public.client_logos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar logos de clientes" ON public.client_logos;

CREATE POLICY "Editor/admin insere logos de clientes"
  ON public.client_logos FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'editor')
    OR public.has_role(auth.uid(), 'admin_master')
  );

CREATE POLICY "Editor/admin atualiza logos de clientes"
  ON public.client_logos FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'editor')
    OR public.has_role(auth.uid(), 'admin_master')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'editor')
    OR public.has_role(auth.uid(), 'admin_master')
  );

-- storage: restrict to editor/admin
DROP POLICY IF EXISTS "Autenticados podem enviar logos no storage" ON storage.objects;
DROP POLICY IF EXISTS "Autenticados podem atualizar logos no storage" ON storage.objects;

CREATE POLICY "Editor/admin envia logos no storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'client-logos'
    AND (
      public.has_role(auth.uid(), 'editor')
      OR public.has_role(auth.uid(), 'admin_master')
    )
  );

CREATE POLICY "Editor/admin atualiza logos no storage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'client-logos'
    AND (
      public.has_role(auth.uid(), 'editor')
      OR public.has_role(auth.uid(), 'admin_master')
    )
  )
  WITH CHECK (
    bucket_id = 'client-logos'
    AND (
      public.has_role(auth.uid(), 'editor')
      OR public.has_role(auth.uid(), 'admin_master')
    )
  );
