-- Marcar 6 duplicatas de compilados pendentes como ignoradas para evitar reenvio em massa ao Monday
-- Mantemos apenas: 0d1b0e56 (23/04 mais recente) e e0015a74 (17/04 mais recente)
UPDATE public.solicitacoes_cartaz
SET monday_item_id = 'duplicata-ignorada'
WHERE id IN (
  'd6d7f2f8-608e-4104-b071-0f23b81fec87',
  'a2b87e97-bada-47c0-b355-e260e5d85403',
  '8ad24ca6-814f-47ec-a0a5-4bea21e66c38',
  'f7014657-81c6-449d-b045-2add127fa62e',
  '49c58ea5-ac84-4ad3-9265-3a1dad76b6ea',
  '2324476d-7b97-4bc2-8bcb-101754d59244'
);