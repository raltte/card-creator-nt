import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * Página de SSO - recebe token do sistema principal e autentica automaticamente
 * 
 * URL esperada: /sso?access_token=xxx&refresh_token=xxx
 * 
 * O sistema principal (selecao.ntrh.com.br) deve redirecionar assim:
 * 
 * const session = await supabase.auth.getSession();
 * const { access_token, refresh_token } = session.data.session;
 * window.location.href = `https://SEU-DOMINIO/sso?access_token=${access_token}&refresh_token=${refresh_token}`;
 */
const SSOLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticateWithTokens = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      if (!accessToken || !refreshToken) {
        setError('Tokens de autenticação não fornecidos. Redirecionando para login...');
        setTimeout(() => navigate('/auth'), 2000);
        return;
      }

      try {
        // Define a sessão usando os tokens recebidos
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Erro ao definir sessão:', error);
          setError('Sessão expirada ou inválida. Redirecionando para login...');
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }

        if (data.session) {
          // Sucesso! Redireciona para o painel
          navigate('/painel', { replace: true });
        } else {
          setError('Não foi possível autenticar. Redirecionando para login...');
          setTimeout(() => navigate('/auth'), 2000);
        }
      } catch (err) {
        console.error('Erro durante SSO:', err);
        setError('Erro ao processar autenticação. Redirecionando para login...');
        setTimeout(() => navigate('/auth'), 2000);
      }
    };

    authenticateWithTokens();
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
            <p className="text-muted-foreground">Autenticando...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SSOLogin;
