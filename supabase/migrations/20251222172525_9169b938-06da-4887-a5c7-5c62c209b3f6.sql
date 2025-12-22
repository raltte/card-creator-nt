-- Adicionar novo role 'editor' ao enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';

-- Atualizar a função handle_new_user_role para incluir o editor
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
  user_role public.app_role;
BEGIN
  user_email := NEW.email;
  
  -- Determinar role baseado no email
  IF user_email = 'vitor@novotemporh.com.br' THEN
    user_role := 'admin_master';
  ELSIF user_email = 'nicholas.pedreira@novotempo-rh.com.br' THEN
    user_role := 'editor';
  ELSE
    user_role := 'recrutador';
  END IF;
  
  -- Inserir role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$function$;