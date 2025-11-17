import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2, Calendar, FileText, Layers } from "lucide-react";
import { RecrutadoraForm, RecrutadoraData } from "./RecrutadoraForm";
import { CompiladoForm, CompiladoData } from "./CompiladoForm";
import { CartazPreview } from "./CartazPreview";
import { CartazPreviewMarisa } from "./CartazPreviewMarisa";
import { CompiladoPreview } from "./CompiladoPreview";
import { CompiladoPreviewMarisa } from "./CompiladoPreviewMarisa";
import { CartazData } from "./CartazGenerator";
import { ImageSelector } from "./ImageSelector";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const RecrutadoraDashboard = () => {
  const { toast } = useToast();
  const [tipoCartaz, setTipoCartaz] = useState<'individual' | 'compilado' | null>(null);
  const [cartazGerado, setCartazGerado] = useState<CartazData | null>(null);
  const [compiladoGerado, setCompiladoGerado] = useState<CompiladoData | null>(null);
  const [etapaAtual, setEtapaAtual] = useState<'selecaoTipo' | 'selecaoModelo' | 'formulario' | 'selecaoImagem' | 'preview'>('selecaoTipo');
  const [dadosFormulario, setDadosFormulario] = useState<RecrutadoraData | null>(null);
  const [modeloSelecionado, setModeloSelecionado] = useState<'padrao' | 'marisa'>('padrao');
  const [isSendingToMonday, setIsSendingToMonday] = useState(false);
  const [lastMondaySendTime, setLastMondaySendTime] = useState<number>(0);
  const [dadosCompilado, setDadosCompilado] = useState<CompiladoData>({
    image: '',
    local: '',
    vagas: [{ codigo: '', cargo: '' }],
    requisitos: '',
    isPcd: false,
    clientTemplate: 'padrao',
    contato: { tipo: 'site', valor: 'novotemporh.com.br' }
  });

  const handleTipoSelect = (tipo: 'individual' | 'compilado') => {
    setTipoCartaz(tipo);
    setEtapaAtual('selecaoModelo');
  };

  const handleModeloSelect = (modelo: 'padrao' | 'marisa') => {
    setModeloSelecionado(modelo);
    if (tipoCartaz === 'compilado') {
      setDadosCompilado({
        ...dadosCompilado,
        clientTemplate: modelo,
        contato: { 
          ...dadosCompilado.contato,
          valor: modelo === 'marisa' ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br'
        }
      });
    }
    setEtapaAtual('formulario');
  };

  const converterDados = (dados: RecrutadoraData, imagemUrl: string): CartazData => {
    // Mapeamento dos dados do formulário de recrutadora para o formato do cartaz
    let contatoInfo: CartazData['contato'];
    
    switch (dados.captacaoCurriculo) {
      case 'whatsapp':
        contatoInfo = {
          tipo: 'whatsapp',
          valor: dados.whatsappNumber || ''
        };
        break;
      case 'email':
        contatoInfo = {
          tipo: 'email',
          valor: dados.emailCaptacao || 'email@novotemporh.com.br'
        };
        break;
      default:
        contatoInfo = {
          tipo: 'site',
          valor: modeloSelecionado === 'marisa' ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br'
        };
    }

    return {
      image: imagemUrl,
      cargo: dados.nomeVaga,
      local: dados.cidadeEstado,
      codigo: dados.codigoPS,
      tipoContrato: dados.tipoContrato,
      requisitos: dados.requisitos.join('\n• '),
      isPcd: false,
      clientTemplate: modeloSelecionado,
      contato: contatoInfo
    };
  };

  const handleFormSubmit = (dados: RecrutadoraData) => {
    setDadosFormulario(dados);
    setEtapaAtual('selecaoImagem');
  };

  const handleCompiladoGenerate = () => {
    setCompiladoGerado(dadosCompilado);
    setEtapaAtual('preview');
    toast({
      title: "Compilado gerado com sucesso!",
      description: "Você pode visualizar, baixar ou compartilhar o compilado."
    });
  };

  const handleImageSelect = (croppedImageData: string) => {
    // A imagem já vem enquadrada do ImageSelector
    if (dadosFormulario) {
      const cartazData = converterDados(dadosFormulario, croppedImageData);
      setCartazGerado(cartazData);
      setEtapaAtual('preview');
      
      toast({
        title: "Cartaz gerado com sucesso!",
        description: "Você pode visualizar, baixar ou compartilhar o cartaz."
      });
    }
  };

  const voltarSelecaoTipo = () => {
    setEtapaAtual('selecaoTipo');
    setTipoCartaz(null);
    setCartazGerado(null);
    setCompiladoGerado(null);
    setDadosFormulario(null);
  };

  const voltarSelecaoModelo = () => {
    setEtapaAtual('selecaoModelo');
    setCartazGerado(null);
    setCompiladoGerado(null);
    setDadosFormulario(null);
  };

  const voltarFormulario = () => {
    setEtapaAtual('formulario');
    setCartazGerado(null);
    setCompiladoGerado(null);
    setDadosFormulario(null);
  };

  const voltarSelecaoImagem = () => {
    setEtapaAtual('selecaoImagem');
  };

  const getImagemAtual = () => {
    if (tipoCartaz === 'compilado' && compiladoGerado?.image) {
      return compiladoGerado.image;
    }
    return cartazGerado?.image;
  };

  const handleDownload = async () => {
    const dataAtual = tipoCartaz === 'compilado' ? compiladoGerado : cartazGerado;
    if (!dataAtual) return;
    
    try {
      const canvas = document.getElementById('cartaz-canvas') as HTMLCanvasElement;
      if (!canvas) {
        toast({
          title: "Erro",
          description: "Não foi possível gerar o cartaz. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      const link = document.createElement('a');
      const nomeArquivo = tipoCartaz === 'compilado' 
        ? `compilado-${dataAtual.local.replace(/\s+/g, '-').toLowerCase()}.png`
        : `cartaz-${(dataAtual as CartazData).cargo.replace(/\s+/g, '-').toLowerCase()}-${(dataAtual as CartazData).codigo}.png`;
      
      link.download = nomeArquivo;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      toast({
        title: "Sucesso!",
        description: "Cartaz baixado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao baixar o cartaz. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    const dataAtual = tipoCartaz === 'compilado' ? compiladoGerado : cartazGerado;
    if (!dataAtual) return;
    
    try {
      const canvas = document.getElementById('cartaz-canvas') as HTMLCanvasElement;
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'cartaz.png', { type: 'image/png' })] })) {
          const file = new File([blob], 'cartaz.png', { type: 'image/png' });
          const titulo = tipoCartaz === 'compilado'
            ? `Vagas disponíveis em ${dataAtual.local}`
            : `Vaga: ${(dataAtual as CartazData).cargo}`;
          
          await navigator.share({
            title: titulo,
            text: `Confira esta oportunidade de emprego na Novo Tempo RH`,
            files: [file]
          });
        } else {
          // Fallback: copy to clipboard
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          toast({
            title: "Copiado!",
            description: "Cartaz copiado para a área de transferência."
          });
        }
      }, 'image/png', 1.0);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao compartilhar o cartaz.",
        variant: "destructive"
      });
    }
  };

  const handleMondayIntegration = async () => {
    const dataAtual = tipoCartaz === 'compilado' ? compiladoGerado : cartazGerado;
    if (!dataAtual) {
      toast({
        title: "Erro",
        description: "Nenhum cartaz foi gerado ainda.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se passou 5 segundos desde o último envio
    const now = Date.now();
    const timeSinceLastSend = now - lastMondaySendTime;
    if (timeSinceLastSend < 5000) {
      const remainingTime = Math.ceil((5000 - timeSinceLastSend) / 1000);
      toast({
        title: "Aguarde",
        description: `Aguarde ${remainingTime} segundos para enviar novamente.`,
        variant: "destructive",
      });
      return;
    }

    // Envia diretamente para o board padrão 8717502047
    await handleSendToBoard(8717502047);
  };

  const handleSendToBoard = async (boardId: number) => {
    const dataAtual = tipoCartaz === 'compilado' ? compiladoGerado : cartazGerado;
    if (!dataAtual) return;
    
    setIsSendingToMonday(true);
    
    try {
      toast({
        title: "Enviando...",
        description: "Preparando cartaz para enviar ao Monday.com...",
      });

      // Converter canvas para base64
      const canvas = document.getElementById('cartaz-canvas') as HTMLCanvasElement;
      const imageData = canvas ? canvas.toDataURL('image/png', 1.0) : getImagemAtual();

      const { data, error } = await supabase.functions.invoke('monday-integration', {
        body: {
          action: 'send_cartaz',
          cartazData: {
            ...dataAtual,
            image: imageData
          },
          boardId: boardId,
          groupId: null // será selecionado automaticamente
        }
      });

      if (error) {
        throw error;
      }

      setLastMondaySendTime(Date.now());
      
      toast({
        title: "Sucesso!",
        description: "Cartaz enviado para Monday.com para aprovação!"
      });
    } catch (error: any) {
      console.error('Erro na integração Monday.com:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar para Monday.com.",
        variant: "destructive"
      });
    } finally {
      setIsSendingToMonday(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nt-light/10 to-background p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-nt-dark mb-2">
            Dashboard de Recrutadoras
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Sistema de Geração de Cartazes - Novo Tempo RH
          </p>
          
          {/* Indicador de Etapa */}
          {etapaAtual !== 'selecaoTipo' && (
            <div className="mt-4 sm:mt-6 flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto pb-2">
              <div className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                etapaAtual === 'selecaoModelo' ? 'bg-nt-primary text-white' : 
                ['formulario', 'selecaoImagem', 'preview'].includes(etapaAtual) ? 'bg-nt-primary/20 text-nt-primary' : 
                'bg-muted text-muted-foreground'
              }`}>
                1. Modelo
              </div>
              <div className="w-4 sm:w-8 h-0.5 bg-border flex-shrink-0" />
              <div className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                etapaAtual === 'formulario' ? 'bg-nt-primary text-white' : 
                ['selecaoImagem', 'preview'].includes(etapaAtual) ? 'bg-nt-primary/20 text-nt-primary' : 
                'bg-muted text-muted-foreground'
              }`}>
                2. Formulário
              </div>
              {tipoCartaz === 'individual' && (
                <>
                  <div className="w-4 sm:w-8 h-0.5 bg-border flex-shrink-0" />
                  <div className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                    etapaAtual === 'selecaoImagem' ? 'bg-nt-primary text-white' : 
                    etapaAtual === 'preview' ? 'bg-nt-primary/20 text-nt-primary' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    3. Imagem
                  </div>
                </>
              )}
              <div className="w-4 sm:w-8 h-0.5 bg-border flex-shrink-0" />
              <div className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                etapaAtual === 'preview' ? 'bg-nt-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {tipoCartaz === 'individual' ? '4. Preview' : '3. Preview'}
              </div>
            </div>
          )}
        </div>

        {etapaAtual === 'selecaoTipo' ? (
          /* Seleção de Tipo */
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-nt-dark mb-6 text-center">
                O que você deseja criar?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-nt-primary"
                  onClick={() => handleTipoSelect('individual')}
                >
                  <CardContent className="p-4 sm:p-6 text-center">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-nt-primary" />
                    <h3 className="text-lg sm:text-xl font-bold text-nt-dark mb-2">Cartaz Individual</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Cartaz para uma única vaga com foto e informações específicas
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-nt-primary"
                  onClick={() => handleTipoSelect('compilado')}
                >
                  <CardContent className="p-4 sm:p-6 text-center">
                    <Layers className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-nt-primary" />
                    <h3 className="text-lg sm:text-xl font-bold text-nt-dark mb-2">Compilado de Vagas</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Lista múltiplas vagas em um único cartaz
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        ) : etapaAtual === 'selecaoModelo' ? (
          /* Seleção de Modelo */
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <Button variant="ghost" onClick={voltarSelecaoTipo} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar à Seleção de Tipo
              </Button>
              <h2 className="text-2xl font-semibold text-nt-dark mb-6 text-center">
                Selecione o Modelo do {tipoCartaz === 'compilado' ? 'Compilado' : 'Cartaz'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-nt-primary"
                  onClick={() => handleModeloSelect('padrao')}
                >
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="mb-3 sm:mb-4 text-3xl sm:text-4xl">📋</div>
                    <h3 className="text-lg sm:text-xl font-bold text-nt-dark mb-2">Modelo Tradicional</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Cartaz padrão Novo Tempo RH com design verde e moderno
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-[#E5007E]"
                  onClick={() => handleModeloSelect('marisa')}
                >
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="mb-3 sm:mb-4 text-3xl sm:text-4xl">💼</div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#E5007E] mb-2">Modelo Marisa</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Cartaz personalizado para vagas Marisa com design rosa
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        ) : etapaAtual === 'formulario' ? (
          /* Formulário de Solicitação */
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <Button variant="ghost" onClick={voltarSelecaoModelo} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar à Seleção de Modelo
              </Button>
              <h2 className="text-2xl font-semibold text-nt-dark mb-6">
                {tipoCartaz === 'compilado' ? 'Criar Compilado de Vagas' : 'Solicitar Cartaz de Vaga'} - {modeloSelecionado === 'marisa' ? 'Marisa' : 'Tradicional'}
              </h2>
              
              {tipoCartaz === 'compilado' ? (
                <>
                  <CompiladoForm 
                    data={dadosCompilado}
                    onChange={setDadosCompilado}
                  />
                  <div className="mt-6">
                    <Button 
                      onClick={handleCompiladoGenerate}
                      className="w-full"
                      disabled={!dadosCompilado.local || dadosCompilado.vagas.some(v => !v.codigo || !v.cargo)}
                    >
                      Gerar Compilado
                    </Button>
                  </div>
                </>
              ) : (
                <RecrutadoraForm onSubmit={handleFormSubmit} />
              )}
            </CardContent>
          </Card>
        ) : etapaAtual === 'selecaoImagem' && dadosFormulario ? (
          /* Seleção de Imagem */
          <Card className="max-w-6xl mx-auto">
            <CardContent className="p-8">
              <ImageSelector
                jobData={dadosFormulario}
                onImageSelect={handleImageSelect}
                onBack={voltarFormulario}
                clientTemplate={modeloSelecionado}
              />
            </CardContent>
          </Card>
        ) : (
          /* Visualização do Cartaz/Compilado Gerado */
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                onClick={voltarFormulario}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Formulário
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
                <Button 
                  variant="outline" 
                  onClick={handleMondayIntegration}
                  disabled={isSendingToMonday}
                  className="w-full sm:w-auto sm:min-w-[220px]"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {isSendingToMonday ? 'Enviando...' : 'Enviar para Monday.com'}
                </Button>
                <Button variant="outline" onClick={handleShare} className="w-full sm:w-auto">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
                <Button onClick={handleDownload} className="w-full sm:w-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PNG
                </Button>
              </div>
            </div>

            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
                <TabsTrigger value="preview" className="text-xs sm:text-sm">Visualização</TabsTrigger>
                <TabsTrigger value="fullscreen" className="text-xs sm:text-sm">Tela Cheia</TabsTrigger>
              </TabsList>

              <TabsContent value="preview">
                <Card>
                  <CardContent className="p-4 sm:p-8">
                    <h2 className="text-xl sm:text-2xl font-semibold text-nt-dark mb-4 sm:mb-6 text-center">
                      {tipoCartaz === 'compilado' ? 'Compilado' : 'Cartaz'} Gerado
                    </h2>
                    <div className="flex justify-center overflow-x-auto">
                      {tipoCartaz === 'compilado' ? (
                        modeloSelecionado === 'marisa' ? (
                          <CompiladoPreviewMarisa data={compiladoGerado!} />
                        ) : (
                          <CompiladoPreview data={compiladoGerado!} />
                        )
                      ) : (
                        modeloSelecionado === 'marisa' ? (
                          <CartazPreviewMarisa data={cartazGerado!} />
                        ) : (
                          <CartazPreview data={cartazGerado!} />
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fullscreen">
                <Card>
                  <CardContent className="p-4 sm:p-8">
                    <h2 className="text-xl sm:text-2xl font-semibold text-nt-dark mb-4 sm:mb-8 text-center">
                      Visualização em Tela Cheia
                    </h2>
                    <div className="flex justify-center overflow-x-auto">
                      <div className="scale-100 sm:scale-125 origin-top">
                        {tipoCartaz === 'compilado' ? (
                          modeloSelecionado === 'marisa' ? (
                            <CompiladoPreviewMarisa data={compiladoGerado!} />
                          ) : (
                            <CompiladoPreview data={compiladoGerado!} />
                          )
                        ) : (
                          modeloSelecionado === 'marisa' ? (
                            <CartazPreviewMarisa data={cartazGerado!} />
                          ) : (
                            <CartazPreview data={cartazGerado!} />
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};