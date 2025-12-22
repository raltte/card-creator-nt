-- Corrigir search_path na função existente
CREATE OR REPLACE FUNCTION public.update_solicitacoes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;