import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Send, Upload, Save, Crop } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ImageSelector } from "@/components/ImageSelector";
import { ImageFraming } from "@/components/ImageFraming";
import { CartazPreview } from "@/components/CartazPreview";
import { CartazPreviewMarisa } from "@/components/CartazPreviewMarisa";
import { CartazPreviewWeg } from "@/components/CartazPreviewWeg";
import { CartazPreviewVagaInterna } from "@/components/CartazPreviewVagaInterna";
import { CartazPreviewDMCard } from "@/components/CartazPreviewDMCard";
import { CompiladoPreview } from "@/components/CompiladoPreview";
import { CompiladoPreviewMarisa } from "@/components/CompiladoPreviewMarisa";
import { MutiraoPreview } from "@/components/MutiraoPreview";
import { MutiraoPreviewTradicional } from "@/components/MutiraoPreviewTradicional";
import { MondayItemSelector } from "@/components/MondayItemSelector";
import { CartazData } from "@/components/CartazGenerator";
import { CompiladoData } from "@/components/CompiladoForm";
import { MutiraoData } from "@/components/MutiraoForm";

const Finalizar = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isEditor } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [solicitacao, setSolicitacao] = useState<any>(null);
  const [etapa, setEtapa] = useState<'selecaoImagem' | 'preview' | 'enquadramento'>('selecaoImagem');
  const [cartazData, setCartazData] = useState<CartazData | null>(null);
  const [compiladoData, setCompiladoData] = useState<CompiladoData | null>(null);
  const [mutiraoData, setMutiraoData] = useState<MutiraoData | null>(null);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [showMondaySelector, setShowMondaySelector] = useState(false);
  const [imagemFinalizada, setImagemFinalizada] = useState<string | null>(null);
  const [imagemBaseUrl, setImagemBaseUrl] = useState<string | null>(null); // framed image for enquadramento
  const [imagemOriginalUrl, setImagemOriginalUrl] = useState<string | null>(null); // original unframed image

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
        // Permitir re-edição de cartazes já concluídos
        toast({
          title: "Reabrindo cartaz",
          description: "Você pode editar e gerar novamente este cartaz.",
        });
      }

      setSolicitacao(data);
      
      // Usar imagem base salva (original não cropada) para re-enquadramento
      if (data.imagem_base_url) {
        setImagemOriginalUrl(data.imagem_base_url);
        // Ir direto para enquadramento para que o usuário ajuste o crop
        setEtapa('enquadramento');
      } else if (data.imagem_url) {
        // Fallback antigo: sem imagem base salva, ir para seleção de nova imagem
        setLoading(false);
        return;
      }
      
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

  // Atualiza o preview em tempo real quando campos são editados
  const atualizarPreview = (sol: any) => {
    if (!sol) return;
    const currentImage = cartazData?.image || compiladoData?.image || mutiraoData?.image || '';
    const isMutirao = sol.modelo_cartaz?.includes('mutirao');
    const isCompilado = sol.modelo_cartaz.includes('compilado');
    const localParts = (sol.local || '').split(' - ');

    if (isMutirao) {
      const detalhes = sol.requisitos || '';
      const atividades = sol.atividades || '';
      const dataPrazoMatch = atividades.match(/Data\/Prazo:\s*([^\n]+)/);
      const dataPrazo = dataPrazoMatch ? dataPrazoMatch[1].trim() : '';
      const mensagemExtra = atividades.replace(/Data\/Prazo:[^\n]*\n?/, '').trim();
      setMutiraoData({
        image: currentImage as any,
        tipoMutirao: 'Curriculos',
        cargo: sol.cargo,
        tipoContrato: sol.tipo_contrato,
        detalhes,
        localEntrega: sol.local || '',
        dataPrazo,
        mensagemExtra,
        modeloMutirao: sol.modelo_cartaz === 'mutirao-tradicional' ? 'tradicional' : 'bombril',
        contato: { tipo: (sol.contato_tipo || 'site') as any, valor: sol.contato_valor || 'novotemporh.com.br' }
      });
    } else if (isCompilado) {
      setCompiladoData({
        image: currentImage,
        cidade: localParts[0] || '',
        estado: localParts[1] || '',
        vagas: [{ codigo: sol.codigo, cargo: sol.cargo }],
        requisitos: sol.requisitos || sol.atividades || '',
        isPcd: sol.is_pcd || false,
        clientTemplate: sol.modelo_cartaz.includes('marisa') ? 'marisa' : 'padrao',
        contato: {
          tipo: sol.contato_tipo || 'site',
          valor: sol.contato_valor || 'novotemporh.com.br'
        },
        get local() { return this.cidade && this.estado ? `${this.cidade} - ${this.estado}` : ""; }
      });
    } else {
      setCartazData({
        image: currentImage,
        cargo: sol.cargo,
        cidade: localParts[0] || '',
        estado: localParts[1] || '',
        codigo: sol.codigo,
        tipoContrato: sol.tipo_contrato,
        requisitos: sol.requisitos || '',
        isPcd: sol.is_pcd || false,
        clientTemplate: (['marisa', 'weg', 'vaga-interna', 'dm-card'].includes(sol.modelo_cartaz) ? sol.modelo_cartaz : 'padrao') as CartazData['clientTemplate'],
        contato: {
          tipo: sol.contato_tipo || 'site',
          valor: sol.contato_valor || 'novotemporh.com.br'
        },
        get local() { return this.cidade && this.estado ? `${this.cidade} - ${this.estado}` : ""; }
      });
    }
  };

  const salvarAlteracoes = async () => {
    if (!solicitacao || !id) return;
    try {
      const { error } = await supabase
        .from('solicitacoes_cartaz')
        .update({
          cargo: solicitacao.cargo,
          codigo: solicitacao.codigo,
          local: solicitacao.local,
          requisitos: solicitacao.requisitos,
          atividades: solicitacao.atividades,
          tipo_contrato: solicitacao.tipo_contrato,
        })
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Salvo!", description: "Alterações salvas com sucesso." });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    }
  };

  const handleImagemSelecionada = (imagemUrl: string, solicitacaoOverrideOrOriginal?: any, originalUrl?: string) => {
    // If called from ImageSelector: (framedUrl, undefined, originalUrl)
    // If called from enquadramento: (framedUrl) — originalUrl already set
    // If called from carregarSolicitacao: (framedUrl, solicitacaoData)
    const sol = (typeof solicitacaoOverrideOrOriginal === 'object' && solicitacaoOverrideOrOriginal !== null && solicitacaoOverrideOrOriginal.modelo_cartaz) 
      ? solicitacaoOverrideOrOriginal 
      : solicitacao;
    if (!sol) return;
    
    // Save the original unframed image if provided
    if (originalUrl) {
      setImagemOriginalUrl(originalUrl);
    }
    // Save the framed image for re-framing
    setImagemBaseUrl(imagemUrl);

    const isMutirao = sol.modelo_cartaz?.includes('mutirao');
    const isCompilado = sol.modelo_cartaz.includes('compilado');

    if (isMutirao) {
      const detalhes = sol.requisitos || '';
      const atividades = sol.atividades || '';
      const dataPrazoMatch = atividades.match(/Data\/Prazo:\s*([^\n]+)/);
      const dataPrazo = dataPrazoMatch ? dataPrazoMatch[1].trim() : '';
      const mensagemExtra = atividades.replace(/Data\/Prazo:[^\n]*\n?/, '').trim();
      setMutiraoData({
        image: imagemUrl,
        tipoMutirao: 'Curriculos',
        cargo: sol.cargo,
        tipoContrato: sol.tipo_contrato,
        detalhes,
        localEntrega: sol.local || '',
        dataPrazo,
        mensagemExtra,
        modeloMutirao: sol.modelo_cartaz === 'mutirao-tradicional' ? 'tradicional' : 'bombril',
        contato: { tipo: (sol.contato_tipo || 'site') as any, valor: sol.contato_valor || 'novotemporh.com.br' }
      });
    } else if (isCompilado) {
      const localParts = (sol.local || '').split(' - ');
      const dados: CompiladoData = {
        image: imagemUrl,
        cidade: localParts[0] || '',
        estado: localParts[1] || '',
        vagas: [{ codigo: sol.codigo, cargo: sol.cargo }],
        requisitos: sol.requisitos || sol.atividades || '',
        isPcd: sol.is_pcd || false,
        clientTemplate: sol.modelo_cartaz.includes('marisa') ? 'marisa' : 'padrao',
        contato: {
          tipo: sol.contato_tipo || 'site',
          valor: sol.contato_valor || (sol.modelo_cartaz.includes('marisa') ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br')
        },
        get local() {
          return this.cidade && this.estado ? `${this.cidade} - ${this.estado}` : "";
        }
      };
      setCompiladoData(dados);
    } else {
      const localParts = (sol.local || '').split(' - ');
      const dados: CartazData = {
        image: imagemUrl,
        cargo: sol.cargo,
        cidade: localParts[0] || '',
        estado: localParts[1] || '',
        codigo: sol.codigo,
        tipoContrato: sol.tipo_contrato,
        requisitos: sol.requisitos || '',
        isPcd: sol.is_pcd || false,
        clientTemplate: (['marisa', 'weg', 'vaga-interna', 'dm-card'].includes(sol.modelo_cartaz) ? sol.modelo_cartaz : 'padrao') as CartazData['clientTemplate'],
        contato: {
          tipo: sol.contato_tipo || 'site',
          valor: sol.contato_valor || (sol.modelo_cartaz === 'marisa' ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br')
        },
        get local() {
          return this.cidade && this.estado ? `${this.cidade} - ${this.estado}` : "";
        }
      };
      setCartazData(dados);
    }

    setEtapa('preview');
  };

  const handleFinalizar = async (mondayItemId?: string, createInGroupId?: string) => {
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
          imagemUrl: imagemUrl,
          imagemBaseUrl: imagemOriginalUrl || imagemBaseUrl || null,
          mondayItemId: mondayItemId || solicitacao?.monday_item_id,
          createInGroupId: createInGroupId
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Cartaz finalizado e enviado para o Monday.com!",
      });

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

  const handleFinalizarComSelecao = () => {
    setShowMondaySelector(true);
  };

  const handleMondayItemSelect = (item: { id: string; name: string; codigo: string }) => {
    setShowMondaySelector(false);
    handleFinalizar(item.id);
  };

  const handleCreateNewMondayItem = (groupId: string) => {
    // Criar novo item no Monday e anexar o cartaz
    handleFinalizar(undefined, groupId);
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

  const isMutirao = solicitacao.modelo_cartaz?.includes('mutirao');
  const isCompilado = solicitacao.modelo_cartaz.includes('compilado');
  const isMarisa = solicitacao.modelo_cartaz.includes('marisa');
  const isWeg = solicitacao.modelo_cartaz === 'weg';
  const isVagaInterna = solicitacao.modelo_cartaz === 'vaga-interna';
  const isDMCard = solicitacao.modelo_cartaz === 'dm-card';

  return (
    <div className="min-h-screen bg-gradient-to-br from-nt-light/10 to-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => etapa === 'enquadramento' ? setEtapa('preview') : etapa === 'preview' ? setEtapa('selecaoImagem') : navigate('/')}
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
            onImageSelect={(framedUrl, originalUrl) => handleImagemSelecionada(framedUrl, undefined, originalUrl)}
            onBack={() => navigate('/')}
            clientTemplate={isVagaInterna ? 'vaga-interna' : isDMCard ? 'dm-card' : isMarisa ? 'marisa' : isWeg ? 'weg' : 'padrao'}
          />
        )}

        {etapa === 'enquadramento' && (imagemOriginalUrl || imagemBaseUrl) && (
          <div className="max-w-2xl mx-auto">
            <ImageFraming
              imageUrl={imagemOriginalUrl || imagemBaseUrl!}
              onFramingComplete={(croppedImageData) => {
                setImagemBaseUrl(croppedImageData);
                handleImagemSelecionada(croppedImageData);
                setEtapa('preview');
              }}
              onBack={() => setEtapa('preview')}
              modelType={isMarisa ? 'tradicional-marisa' : isCompilado ? 'compilado' : 'tradicional-nt'}
            />
          </div>
        )}

        {etapa === 'preview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Preview do Cartaz</h2>
                <div className="w-full overflow-hidden" style={{ maxWidth: '100%' }}>
                  <div className="cartaz-container-large">
                    {isCompilado ? (
                      isMarisa && compiladoData ? (
                        <CompiladoPreviewMarisa data={compiladoData} />
                      ) : compiladoData ? (
                        <CompiladoPreview data={compiladoData} />
                      ) : null
                    ) : (
                      isVagaInterna && cartazData ? (
                        <CartazPreviewVagaInterna data={cartazData} />
                      ) : isDMCard && cartazData ? (
                        <CartazPreviewDMCard data={cartazData} />
                      ) : isWeg && cartazData ? (
                        <CartazPreviewWeg data={cartazData} />
                      ) : isMarisa && cartazData ? (
                        <CartazPreviewMarisa data={cartazData} />
                      ) : cartazData ? (
                        <CartazPreview data={cartazData} />
                      ) : null
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Editar Informações</h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Código</Label>
                      <Input
                        value={solicitacao.codigo}
                        onChange={(e) => {
                          setSolicitacao({ ...solicitacao, codigo: e.target.value });
                          atualizarPreview({ ...solicitacao, codigo: e.target.value });
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tipo de Contrato</Label>
                      <Input
                        value={solicitacao.tipo_contrato}
                        onChange={(e) => {
                          setSolicitacao({ ...solicitacao, tipo_contrato: e.target.value });
                          atualizarPreview({ ...solicitacao, tipo_contrato: e.target.value });
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Cargo</Label>
                    <Input
                      value={solicitacao.cargo}
                      onChange={(e) => {
                        setSolicitacao({ ...solicitacao, cargo: e.target.value });
                        atualizarPreview({ ...solicitacao, cargo: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Local</Label>
                    <Input
                      value={solicitacao.local || ''}
                      onChange={(e) => {
                        setSolicitacao({ ...solicitacao, local: e.target.value });
                        atualizarPreview({ ...solicitacao, local: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Requisitos</Label>
                    <Textarea
                      value={solicitacao.requisitos || ''}
                      rows={4}
                      onChange={(e) => {
                        setSolicitacao({ ...solicitacao, requisitos: e.target.value });
                        atualizarPreview({ ...solicitacao, requisitos: e.target.value });
                      }}
                    />
                  </div>
                  {solicitacao.atividades && (
                    <div>
                      <Label className="text-xs">Atividades</Label>
                      <Textarea
                        value={solicitacao.atividades || ''}
                        rows={3}
                        onChange={(e) => {
                          setSolicitacao({ ...solicitacao, atividades: e.target.value });
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    onClick={salvarAlteracoes}
                    variant="secondary"
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </Button>
                  <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      if (imagemOriginalUrl || imagemBaseUrl) {
                        setEtapa('enquadramento');
                      } else {
                        setEtapa('selecaoImagem');
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Crop className="mr-2 h-4 w-4" />
                    Ajustar Imagem
                  </Button>
                  <Button
                    onClick={() => setEtapa('selecaoImagem')}
                    variant="outline"
                    className="flex-1"
                  >
                    Trocar Imagem
                  </Button>
                  {isEditor && !solicitacao?.monday_item_id ? (
                    <Button
                      onClick={handleFinalizarComSelecao}
                      disabled={isFinalizando}
                      className="flex-1"
                    >
                      {isFinalizando ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Finalizando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Selecionar Linha no Monday
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleFinalizar()}
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
                  )}
                  </div>
                </div>

                <MondayItemSelector
                  open={showMondaySelector}
                  onClose={() => setShowMondaySelector(false)}
                  onSelect={handleMondayItemSelect}
                  onCreateNew={handleCreateNewMondayItem}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finalizar;
