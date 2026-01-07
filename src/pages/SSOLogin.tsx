import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * Página de SSO - recebe dados do usuário do sistema principal e autentica automaticamente
 * 
 * URL esperada: /sso?email=xxx&name=xxx
 * 
 * O sistema principal (selecao.ntrh.com.br) deve redirecionar assim:
 * 
 * const { data } = await supabase.auth.getUser();
 * const email = encodeURIComponent(data.user.email);
 * const name = encodeURIComponent(data.user.user_metadata.full_name || '');
 * window.open(`https://novotemporh.raltte.com/sso?email=${email}&name=${name}`, '_blank');
 */
const SSOLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Verificando credenciais...');

  useEffect(() => {
    const authenticateWithUserData = async () => {
      const email = searchParams.get('email');
      const name = searchParams.get('name');

      if (!email) {
        setError('Email não fornecido. Redirecionando para login...');
        setTimeout(() => navigate('/auth'), 2000);
        return;
      }

      try {
        setStatus('Autenticando usuário...');
        
        // Gera uma senha temporária baseada no email (consistente para o mesmo usuário)
        const tempPassword = `SSO_${btoa(email)}_${email.length}!Aa1`;
        
        // Tenta fazer login primeiro
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: tempPassword,
        });

        if (signInData?.session) {
          // Login bem sucedido
          navigate('/painel', { replace: true });
          return;
        }

        // Se não conseguiu logar, tenta criar o usuário
        if (signInError) {
          setStatus('Criando conta...');
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: tempPassword,
            options: {
              data: {
                full_name: name || email.split('@')[0],
                sso_user: true,
              },
              emailRedirectTo: `${window.location.origin}/painel`,
            },
          });

          if (signUpError) {
            console.error('Erro ao criar usuário:', signUpError);
            setError('Não foi possível criar sua conta. Redirecionando para login...');
            setTimeout(() => navigate('/auth'), 2000);
            return;
          }

          if (signUpData?.session) {
            navigate('/painel', { replace: true });
            return;
          }

          // Se chegou aqui, pode ser que o email precisa de confirmação
          // Tenta logar novamente
          const { data: retryData } = await supabase.auth.signInWithPassword({
            email,
            password: tempPassword,
          });

          if (retryData?.session) {
            navigate('/painel', { replace: true });
            return;
          }

          setError('Conta criada! Faça login para continuar.');
          setTimeout(() => navigate('/auth'), 2000);
        }
      } catch (err) {
        console.error('Erro durante SSO:', err);
        setError('Erro ao processar autenticação. Redirecionando para login...');
        setTimeout(() => navigate('/auth'), 2000);
      }
    };

    authenticateWithUserData();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-nt-light/10 to-background flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <p className="text-destructive">{error}</p>
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-nt-light mx-auto" />
            <p className="text-muted-foreground">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SSOLogin;
