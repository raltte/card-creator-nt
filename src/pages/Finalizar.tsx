import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageSelector } from "@/components/ImageSelector";
import { CartazPreview } from "@/components/CartazPreview";
import { CartazPreviewMarisa } from "@/components/CartazPreviewMarisa";
import { CartazPreviewWeg } from "@/components/CartazPreviewWeg";
import { CompiladoPreview } from "@/components/CompiladoPreview";
import { CompiladoPreviewMarisa } from "@/components/CompiladoPreviewMarisa";
import { CartazData } from "@/components/CartazGenerator";
import { CompiladoData } from "@/components/CompiladoForm";

const Finalizar = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [solicitacao, setSolicitacao] = useState<any>(null);
  const [etapa, setEtapa] = useState<'selecaoImagem' | 'preview'>('selecaoImagem');
  const [cartazData, setCartazData] = useState<CartazData | null>(null);
  const [compiladoData, setCompiladoData] = useState<CompiladoData | null>(null);
  const [isFinalizando, setIsFinalizando] = useState(false);

  useEffect(() => {
    if (id) {
      carregarSolicitacao();
    }
  }, [id]);

  const carregarSolicitacao = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes_cartaz')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Erro",
          description: "Solicitação não encontrada.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      if (data.status === 'concluido') {
        toast({
          title: "Aviso",
          description: "Esta solicitação já foi concluída.",
        });
      }

      setSolicitacao(data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar solicitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a solicitação.",
        variant: "destructive"
      });
      navigate('/');
    }
  };

  const handleImagemSelecionada = (imagemUrl: string) => {
    if (!solicitacao) return;

    const isCompilado = solicitacao.modelo_cartaz.includes('compilado');

    if (isCompilado) {
      // Dados do compilado
      const localParts = (solicitacao.local || '').split(' - ');
      const dados: CompiladoData = {
        image: imagemUrl,
        cidade: localParts[0] || '',
        estado: localParts[1] || '',
        vagas: [{ codigo: solicitacao.codigo, cargo: solicitacao.cargo }],
        requisitos: solicitacao.requisitos || solicitacao.atividades || '',
        isPcd: solicitacao.is_pcd || false,
        clientTemplate: solicitacao.modelo_cartaz.includes('marisa') ? 'marisa' : 'padrao',
        contato: {
          tipo: solicitacao.contato_tipo || 'site',
          valor: solicitacao.contato_valor || (solicitacao.modelo_cartaz.includes('marisa') ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br')
        },
        get local() {
          return this.cidade && this.estado ? `${this.cidade} - ${this.estado}` : "";
        }
      };
      setCompiladoData(dados);
    } else {
      // Dados do cartaz tradicional
      const localParts = (solicitacao.local || '').split(' - ');
      const dados: CartazData = {
        image: imagemUrl,
        cargo: solicitacao.cargo,
        cidade: localParts[0] || '',
        estado: localParts[1] || '',
        codigo: solicitacao.codigo,
        tipoContrato: solicitacao.tipo_contrato,
        requisitos: solicitacao.requisitos || '',
        isPcd: solicitacao.is_pcd || false,
        clientTemplate: solicitacao.modelo_cartaz === 'marisa' ? 'marisa' : (solicitacao.modelo_cartaz === 'weg' ? 'weg' : 'padrao'),
        contato: {
          tipo: solicitacao.contato_tipo || 'site',
          valor: solicitacao.contato_valor || (solicitacao.modelo_cartaz === 'marisa' ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br')
        },
        get local() {
          return this.cidade && this.estado ? `${this.cidade} - ${this.estado}` : "";
        }
      };
      setCartazData(dados);
    }

    setEtapa('preview');
  };

  const handleFinalizar = async () => {
    try {
      setIsFinalizando(true);

      const canvas = document.getElementById('cartaz-canvas') as HTMLCanvasElement;
      if (!canvas) {
        throw new Error('Canvas não encontrado');
      }

      const imagemUrl = canvas.toDataURL('image/png', 1.0);

      const { data, error } = await supabase.functions.invoke('finalizar-cartaz', {
        body: {
          solicitacaoId: id,
          imagemUrl: imagemUrl
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Cartaz finalizado e enviado para o Monday.com!",
      });

      // Redirecionar para a home após 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Erro ao finalizar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o cartaz. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsFinalizando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-nt-light/10 to-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-nt-light" />
      </div>
    );
  }

  if (!solicitacao) {
    return null;
  }

  const isCompilado = solicitacao.modelo_cartaz.includes('compilado');
  const isMarisa = solicitacao.modelo_cartaz.includes('marisa');
  const isWeg = solicitacao.modelo_cartaz === 'weg';

  return (
    <div className="min-h-screen bg-gradient-to-br from-nt-light/10 to-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => etapa === 'preview' ? setEtapa('selecaoImagem') : navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-nt-dark">
              Finalizar Cartaz - {solicitacao.cargo}
            </h1>
            <p className="text-muted-foreground">
              Código: {solicitacao.codigo} • {solicitacao.local}
            </p>
          </div>
        </div>

        {etapa === 'selecaoImagem' && (
          <ImageSelector
            jobData={{
              nomeVaga: solicitacao.cargo,
              setorAtuacao: solicitacao.local || '',
              tipoContrato: solicitacao.tipo_contrato,
              requisitos: solicitacao.requisitos ? solicitacao.requisitos.split('\n') : []
            }}
            onImageSelect={handleImagemSelecionada}
            onBack={() => navigate('/')}
            clientTemplate={isMarisa ? 'marisa' : isWeg ? 'weg' : 'padrao'}
          />
        )}

        {etapa === 'preview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Preview do Cartaz</h2>
                {isCompilado ? (
                  isMarisa && compiladoData ? (
                    <CompiladoPreviewMarisa data={compiladoData} />
                  ) : compiladoData ? (
                    <CompiladoPreview data={compiladoData} />
                  ) : null
                ) : (
                  isWeg && cartazData ? (
                    <CartazPreviewWeg data={cartazData} />
                  ) : isMarisa && cartazData ? (
                    <CartazPreviewMarisa data={cartazData} />
                  ) : cartazData ? (
                    <CartazPreview data={cartazData} />
                  ) : null
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Informações da Vaga</h2>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Código:</span> {solicitacao.codigo}
                  </div>
                  <div>
                    <span className="font-medium">Cargo:</span> {solicitacao.cargo}
                  </div>
                  <div>
                    <span className="font-medium">Tipo de Contrato:</span> {solicitacao.tipo_contrato}
                  </div>
                  <div>
                    <span className="font-medium">Local:</span> {solicitacao.local}
                  </div>
                  {solicitacao.requisitos && (
                    <div>
                      <span className="font-medium">Requisitos:</span>
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                        {solicitacao.requisitos}
                      </p>
                    </div>
                  )}
                  {solicitacao.atividades && (
                    <div>
                      <span className="font-medium">Atividades:</span>
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                        {solicitacao.atividades}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() => setEtapa('selecaoImagem')}
                    variant="outline"
                    className="flex-1"
                  >
                    Trocar Imagem
                  </Button>
                  <Button
                    onClick={handleFinalizar}
                    disabled={isFinalizando}
                    className="flex-1"
                  >
                    {isFinalizando ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      'Finalizar e Enviar'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finalizar;
