import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Edit, Clock, MapPin, Briefcase, ChevronRight, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Solicitacao {
  id: string;
  cargo: string;
  codigo: string;
  local: string | null;
  modelo_cartaz: string;
  tipo_contrato: string;
  status: string | null;
  created_at: string;
  updated_at: string;
  imagem_url: string | null;
}

const modeloLabels: Record<string, string> = {
  padrao: "Tradicional",
  marisa: "Marisa",
  weg: "WEG",
  "vaga-interna": "Vaga Interna",
  "dm-card": "DM Card",
  "compilado-padrao": "Compilado",
  "compilado-marisa": "Compilado Marisa",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pendente_imagem: { label: "Pendente", variant: "outline" },
  concluido: { label: "Concluído", variant: "default" },
};

export const HistoricoCartazes = () => {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const carregarHistorico = async () => {
    setLoading(true);
    try {
      // Ensure auth session is available before querying
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSolicitacoes([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("solicitacoes_cartaz")
        .select("id, cargo, codigo, local, modelo_cartaz, tipo_contrato, status, created_at, updated_at, imagem_url")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setSolicitacoes(data || []);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      carregarHistorico();
    }
  }, [user]);

  const handleEditar = (id: string) => {
    navigate(`/finalizar/${id}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <History className="w-4 h-4" />
            Últimos Cartazes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (solicitacoes.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <History className="w-4 h-4" />
            Últimos Cartazes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum cartaz gerado ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <History className="w-4 h-4" />
            Últimos Cartazes
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={carregarHistorico}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ScrollArea className="max-h-[420px]">
          <div className="space-y-1.5">
            {solicitacoes.map((s) => {
              const statusInfo = statusLabels[s.status || ""] || { label: s.status || "—", variant: "outline" as const };
              const modeloLabel = modeloLabels[s.modelo_cartaz] || s.modelo_cartaz;

              return (
                <button
                  key={s.id}
                  onClick={() => handleEditar(s.id)}
                  className="w-full text-left rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    {s.imagem_url ? (
                      <div className="shrink-0 w-14 h-14 rounded-md overflow-hidden border bg-muted">
                        <img
                          src={s.imagem_url}
                          alt={s.cargo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="shrink-0 w-14 h-14 rounded-md border bg-muted flex items-center justify-center text-muted-foreground text-xs">
                        Sem img
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{s.cargo}</span>
                        <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {s.codigo}
                        </span>
                        {s.local && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {s.local}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(s.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {modeloLabel}
                        </Badge>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center text-muted-foreground group-hover:text-primary transition-colors">
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
