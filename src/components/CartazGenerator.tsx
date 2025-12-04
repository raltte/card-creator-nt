import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CartazForm } from "./CartazForm";
import { CartazPreview } from "./CartazPreview";
import { CartazPreviewMarisa } from "./CartazPreviewMarisa";
import { CartazPreviewWeg } from "./CartazPreviewWeg";
import { CompiladoForm, CompiladoData } from "./CompiladoForm";
import { CompiladoPreview } from "./CompiladoPreview";
import { CompiladoPreviewMarisa } from "./CompiladoPreviewMarisa";
import { Button } from "@/components/ui/button";
import { Download, Share2, FileImage, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export interface CartazData {
  image?: File | string;
  cargo: string;
  cidade: string;
  estado: string;
  codigo: string;
  tipoContrato: string;
  requisitos: string;
  isPcd: boolean;
  clientTemplate: 'padrao' | 'marisa' | 'weg';
  contato: {
    tipo: 'whatsapp' | 'email' | 'site';
    valor: string;
  };
  // Computed field for backward compatibility
  get local(): string;
}

export const CartazGenerator = () => {
  const { toast } = useToast();
  const [modeloType, setModeloType] = useState<'tradicional' | 'compilado'>('tradicional');
  
  const [cartazData, setCartazData] = useState<CartazData>({
    image: undefined,
    cargo: "",
    cidade: "",
    estado: "",
    codigo: "",
    tipoContrato: "Efetivo",
    requisitos: "",
    isPcd: false,
    clientTemplate: 'padrao',
    contato: {
      tipo: 'site',
      valor: "novotemporh.com.br"
    },
    get local() {
      return this.cidade && this.estado ? `${this.cidade} - ${this.estado}` : "";
    }
  });

  const [compiladoData, setCompiladoData] = useState<CompiladoData>({
    image: undefined,
    cidade: "",
    estado: "",
    vagas: [{ codigo: '', cargo: '' }],
    requisitos: "",
    isPcd: false,
    clientTemplate: 'padrao',
    contato: {
      tipo: 'site',
      valor: "novotemporh.com.br"
    },
    get local() {
      return this.cidade && this.estado ? `${this.cidade} - ${this.estado}` : "";
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

  const renderPreview = () => {
    if (modeloType === 'tradicional') {
      switch (cartazData.clientTemplate) {
        case 'marisa':
          return <CartazPreviewMarisa data={cartazData} />;
        case 'weg':
          return <CartazPreviewWeg data={cartazData} />;
        default:
          return <CartazPreview data={cartazData} />;
      }
    } else {
      return compiladoData.clientTemplate === 'marisa' 
        ? <CompiladoPreviewMarisa data={compiladoData} />
        : <CompiladoPreview data={compiladoData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nt-light/10 to-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-nt-dark mb-1">
            Editor de Cartazes
          </h1>
          <p className="text-muted-foreground">
            Novo Tempo Consultoria e RH
          </p>
        </div>

        {/* Seleção de Modelo */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            variant={modeloType === 'tradicional' ? 'default' : 'outline'}
            onClick={() => setModeloType('tradicional')}
            className="gap-2"
          >
            <FileImage className="w-4 h-4" />
            Individual
          </Button>
          <Button
            variant={modeloType === 'compilado' ? 'default' : 'outline'}
            onClick={() => setModeloType('compilado')}
            className="gap-2"
          >
            <Layers className="w-4 h-4" />
            Compilado
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-nt-dark mb-4">
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
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-nt-dark">
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
                    Copiar
                  </Button>
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={handleDownload}
                    disabled={!isFormValid()}
                    className="bg-nt-light hover:bg-nt-light/90"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Baixar PNG
                  </Button>
                </div>
              </div>
              <div className="flex justify-center overflow-auto max-h-[calc(100vh-180px)]">
                <div className="scale-[0.55] origin-top">
                  {renderPreview()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};