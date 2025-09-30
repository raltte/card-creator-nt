import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CartazForm } from "./CartazForm";
import { CartazPreview } from "./CartazPreview";
import { CompiladoForm, CompiladoData } from "./CompiladoForm";
import { CompiladoPreview } from "./CompiladoPreview";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface CartazData {
  image?: File | string;
  cargo: string;
  local: string;
  codigo: string;
  tipoContrato: string;
  requisitos: string;
  contato: {
    tipo: 'whatsapp' | 'email' | 'site';
    valor: string;
  };
}

export const CartazGenerator = () => {
  const { toast } = useToast();
  const [modeloType, setModeloType] = useState<'tradicional' | 'compilado'>('tradicional');
  
  const [cartazData, setCartazData] = useState<CartazData>({
    image: undefined,
    cargo: "",
    local: "",
    codigo: "",
    tipoContrato: "Efetivo",
    requisitos: "",
    contato: {
      tipo: 'site',
      valor: "novotemporh.com.br"
    }
  });

  const [compiladoData, setCompiladoData] = useState<CompiladoData>({
    image: undefined,
    local: "",
    vagas: [{ codigo: '', cargo: '' }],
    requisitos: "",
    contato: {
      tipo: 'site',
      valor: "novotemporh.com.br"
    }
  });

  const handleDownload = async () => {
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
      if (modeloType === 'tradicional') {
        link.download = `cartaz-${cartazData.cargo.replace(/\s+/g, '-').toLowerCase()}-${cartazData.codigo}.png`;
      } else {
        link.download = `cartaz-compilado-${compiladoData.local.replace(/\s+/g, '-').toLowerCase()}.png`;
      }
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
    try {
      const canvas = document.getElementById('cartaz-canvas') as HTMLCanvasElement;
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const title = modeloType === 'tradicional' 
          ? `Vaga: ${cartazData.cargo}`
          : `Vagas de emprego - ${compiladoData.local}`;
          
        if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'cartaz.png', { type: 'image/png' })] })) {
          const file = new File([blob], 'cartaz.png', { type: 'image/png' });
          await navigator.share({
            title,
            text: `Confira esta oportunidade de emprego na Novo Tempo RH`,
            files: [file]
          });
        } else {
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

  const isFormValid = () => {
    if (modeloType === 'tradicional') {
      return cartazData.cargo && cartazData.local && cartazData.codigo;
    } else {
      return compiladoData.local && compiladoData.vagas.some(v => v.codigo && v.cargo);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nt-light/10 to-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-nt-dark mb-2">
            Gerador de Cartazes de Vagas
          </h1>
          <p className="text-lg text-muted-foreground">
            Novo Tempo Consultoria e RH
          </p>
        </div>

        {/* Seleção de Modelo */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <Label className="text-lg font-semibold mb-4 block">Selecione o tipo de modelo:</Label>
            <RadioGroup value={modeloType} onValueChange={(value: 'tradicional' | 'compilado') => setModeloType(value)}>
              <div className="flex items-center space-x-2 mb-3">
                <RadioGroupItem value="tradicional" id="tradicional" />
                <Label htmlFor="tradicional" className="cursor-pointer">
                  Tradicional - Uma vaga por cartaz
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compilado" id="compilado" />
                <Label htmlFor="compilado" className="cursor-pointer">
                  Compilado - Múltiplas vagas em um cartaz
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Visualização</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulário */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold text-nt-dark mb-6">
                    {modeloType === 'tradicional' ? 'Dados da Vaga' : 'Dados das Vagas'}
                  </h2>
                  {modeloType === 'tradicional' ? (
                    <CartazForm 
                      data={cartazData}
                      onChange={setCartazData}
                    />
                  ) : (
                    <CompiladoForm 
                      data={compiladoData}
                      onChange={setCompiladoData}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Preview em tempo real */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-nt-dark">
                      Prévia
                    </h2>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleShare}
                        disabled={!isFormValid()}
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Compartilhar
                      </Button>
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={handleDownload}
                        disabled={!isFormValid()}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Baixar PNG
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    {modeloType === 'tradicional' ? (
                      <CartazPreview data={cartazData} />
                    ) : (
                      <CompiladoPreview data={compiladoData} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold text-nt-dark">
                    Cartaz Final
                  </h2>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={handleShare}
                      disabled={!isFormValid()}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                    <Button 
                      onClick={handleDownload}
                      disabled={!isFormValid()}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar PNG
                    </Button>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="scale-125 origin-top">
                    {modeloType === 'tradicional' ? (
                      <CartazPreview data={cartazData} />
                    ) : (
                      <CompiladoPreview data={compiladoData} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};