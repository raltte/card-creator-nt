import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2, Calendar } from "lucide-react";
import { RecrutadoraForm, RecrutadoraData } from "./RecrutadoraForm";
import { CartazPreview } from "./CartazPreview";
import { CartazPreviewMarisa } from "./CartazPreviewMarisa";
import { CartazData } from "./CartazGenerator";
import { ImageSelector } from "./ImageSelector";
import { ImageFraming } from "./ImageFraming";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const RecrutadoraDashboard = () => {
  const { toast } = useToast();
  const [cartazGerado, setCartazGerado] = useState<CartazData | null>(null);
  const [etapaAtual, setEtapaAtual] = useState<'selecaoModelo' | 'formulario' | 'selecaoImagem' | 'ajusteImagem' | 'preview'>('selecaoModelo');
  const [dadosFormulario, setDadosFormulario] = useState<RecrutadoraData | null>(null);
  const [imagemSelecionada, setImagemSelecionada] = useState<string | null>(null);
  const [modeloSelecionado, setModeloSelecionado] = useState<'padrao' | 'marisa'>('padrao');

  const handleModeloSelect = (modelo: 'padrao' | 'marisa') => {
    setModeloSelecionado(modelo);
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

  const handleImageSelect = (imagemUrl: string) => {
    setImagemSelecionada(imagemUrl);
    setEtapaAtual('ajusteImagem');
  };

  const handleFramingComplete = (croppedImageData: string) => {
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

  const voltarSelecaoModelo = () => {
    setEtapaAtual('selecaoModelo');
    setCartazGerado(null);
    setDadosFormulario(null);
    setImagemSelecionada(null);
  };

  const voltarFormulario = () => {
    setEtapaAtual('formulario');
    setCartazGerado(null);
    setDadosFormulario(null);
    setImagemSelecionada(null);
  };

  const voltarSelecaoImagem = () => {
    setEtapaAtual('selecaoImagem');
    setImagemSelecionada(null);
  };

  const voltarAjusteImagem = () => {
    setEtapaAtual('ajusteImagem');
    setCartazGerado(null);
  };

  const handleDownload = async () => {
    if (!cartazGerado) return;
    
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
      link.download = `cartaz-${cartazGerado.cargo.replace(/\s+/g, '-').toLowerCase()}-${cartazGerado.codigo}.png`;
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
    if (!cartazGerado) return;
    
    try {
      const canvas = document.getElementById('cartaz-canvas') as HTMLCanvasElement;
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'cartaz.png', { type: 'image/png' })] })) {
          const file = new File([blob], 'cartaz.png', { type: 'image/png' });
          await navigator.share({
            title: `Vaga: ${cartazGerado.cargo}`,
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
    if (!cartazGerado) {
      toast({
        title: "Erro",
        description: "Nenhum cartaz foi gerado ainda.",
        variant: "destructive",
      });
      return;
    }

    // Envia diretamente para o board padrão 8717502047
    await handleSendToBoard(8717502047);
  };

  const handleSendToBoard = async (boardId: number) => {
    if (!cartazGerado) return;
    
    try {
      // Converter canvas para base64
      const canvas = document.getElementById('cartaz-canvas') as HTMLCanvasElement;
      const imageData = canvas ? canvas.toDataURL('image/png', 1.0) : cartazGerado.image;

      const { data, error } = await supabase.functions.invoke('monday-integration', {
        body: {
          action: 'send_cartaz',
          cartazData: {
            ...cartazGerado,
            image: imageData
          },
          boardId: boardId,
          groupId: null // será selecionado automaticamente
        }
      });

      if (error) {
        throw error;
      }

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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nt-light/10 to-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-nt-dark mb-2">
            Dashboard de Recrutadoras
          </h1>
          <p className="text-lg text-muted-foreground">
            Sistema de Geração de Cartazes - Novo Tempo RH
          </p>
        </div>

        {etapaAtual === 'selecaoModelo' ? (
          /* Seleção de Modelo */
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-nt-dark mb-6 text-center">
                Selecione o Tipo de Cartaz
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-nt-primary"
                  onClick={() => handleModeloSelect('padrao')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 text-4xl">📋</div>
                    <h3 className="text-xl font-bold text-nt-dark mb-2">Modelo Tradicional</h3>
                    <p className="text-muted-foreground">
                      Cartaz padrão Novo Tempo RH com design verde e moderno
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-[#E5007E]"
                  onClick={() => handleModeloSelect('marisa')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 text-4xl">💼</div>
                    <h3 className="text-xl font-bold text-[#E5007E] mb-2">Modelo Marisa</h3>
                    <p className="text-muted-foreground">
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
                Solicitar Cartaz de Vaga - {modeloSelecionado === 'marisa' ? 'Marisa' : 'Tradicional'}
              </h2>
              <RecrutadoraForm onSubmit={handleFormSubmit} />
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
              />
            </CardContent>
          </Card>
        ) : etapaAtual === 'ajusteImagem' && imagemSelecionada ? (
          /* Ajuste de Enquadramento */
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <ImageFraming
                imageUrl={imagemSelecionada}
                onFramingComplete={handleFramingComplete}
                onBack={voltarSelecaoImagem}
              />
            </CardContent>
          </Card>
        ) : (
          /* Visualização do Cartaz Gerado */
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={voltarAjusteImagem}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Ajuste de Imagem
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={handleMondayIntegration}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Enviar para Monday.com
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PNG
                </Button>
              </div>
            </div>

            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="preview">Visualização</TabsTrigger>
                <TabsTrigger value="fullscreen">Tela Cheia</TabsTrigger>
              </TabsList>

              <TabsContent value="preview">
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-semibold text-nt-dark mb-6 text-center">
                      Cartaz Gerado
                    </h2>
                    <div className="flex justify-center">
                      {modeloSelecionado === 'marisa' ? (
                        <CartazPreviewMarisa data={cartazGerado!} />
                      ) : (
                        <CartazPreview data={cartazGerado!} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fullscreen">
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-semibold text-nt-dark mb-8 text-center">
                      Visualização em Tela Cheia
                    </h2>
                    <div className="flex justify-center">
                      <div className="scale-125 origin-top">
                        {modeloSelecionado === 'marisa' ? (
                          <CartazPreviewMarisa data={cartazGerado!} />
                        ) : (
                          <CartazPreview data={cartazGerado!} />
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