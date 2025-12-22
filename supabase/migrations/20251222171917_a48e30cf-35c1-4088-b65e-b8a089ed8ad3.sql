-- Corrigir search_path na função handle_new_user_role
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  user_role public.app_role;
BEGIN
  user_email := NEW.email;
  
  -- Determinar role baseado no email
  IF user_email = 'vitor@novotemporh.com.br' THEN
    user_role := 'admin_master';
  ELSIF user_email = 'nicholas.pedreira@novotempo-rh.com.br' THEN
    user_role := 'admin';
  ELSE
    user_role := 'recrutador';
  END IF;
  
  -- Inserir role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;