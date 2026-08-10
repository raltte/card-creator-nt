DROP POLICY IF EXISTS "Editor/admin envia logos no storage" ON storage.objects;
DROP POLICY IF EXISTS "Editor/admin atualiza logos no storage" ON storage.objects;
CREATE POLICY "Autenticados enviam logos no storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'client-logos');
CREATE POLICY "Autenticados atualizam logos no storage" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'client-logos') WITH CHECK (bucket_id = 'client-logos');

DROP POLICY IF EXISTS "Editor/admin insere logos de clientes" ON public.client_logos;
DROP POLICY IF EXISTS "Editor/admin atualiza logos de clientes" ON public.client_logos;
CREATE POLICY "Autenticados inserem logos de clientes" ON public.client_logos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados atualizam logos de clientes" ON public.client_logos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON public.client_logos TO authenticated;