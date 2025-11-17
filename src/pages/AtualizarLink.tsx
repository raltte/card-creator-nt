import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AtualizarLink() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [novoLink, setNovoLink] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const atualizarLink = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase.functions.invoke('atualizar-link-monday', {
          body: { solicitacaoId: id }
        });

        if (error) throw error;

        setNovoLink(data.novoLink);
      } catch (err) {
        console.error('Erro ao atualizar link:', err);
        setError(err instanceof Error ? err.message : 'Erro ao atualizar link');
      } finally {
        setLoading(false);
      }
    };

    atualizarLink();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Atualizando link...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="p-8 max-w-md w-full text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Link Atualizado!</h1>
        <p className="text-muted-foreground mb-6 text-center">
          O link no Monday.com foi atualizado. Você será redirecionado para a página de finalização.
        </p>
        <Button 
          className="w-full"
          onClick={() => window.location.href = novoLink}
        >
          Ir para Finalização
        </Button>
      </Card>
    </div>
  );
}
