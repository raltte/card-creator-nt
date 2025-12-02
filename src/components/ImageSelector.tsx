import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageFraming } from "./ImageFraming";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ImageSelectorProps {
  jobData: {
    nomeVaga: string;
    setorAtuacao: string;
    tipoContrato: string;
    requisitos: string[];
    sugestaoImagem?: string;
  };
  onImageSelect: (imageUrl: string) => void;
  onBack: () => void;
  clientTemplate?: 'padrao' | 'marisa';
}

export const ImageSelector = ({ jobData, onImageSelect, onBack, clientTemplate = 'padrao' }: ImageSelectorProps) => {
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFraming, setShowFraming] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(jobData.sugestaoImagem || "");
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateImages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-job-images', {
        body: {
          jobTitle: jobData.nomeVaga,
          sector: jobData.setorAtuacao,
          contractType: jobData.tipoContrato,
          requirements: jobData.requisitos,
          imageSuggestion: customPrompt.trim() || undefined,
          clientTemplate: clientTemplate,
        }
      });

      if (error) throw error;

      if (data.images && data.images.length > 0) {
        setImages(data.images);
        setHasGenerated(true);
      } else {
        throw new Error('Nenhuma imagem foi gerada');
      }
    } catch (error) {
      console.error('Erro ao gerar imagens:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar imagens. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedImage) {
      setShowFraming(true);
    }
  };

  const handleFramingComplete = (croppedImageData: string) => {
    onImageSelect(croppedImageData);
  };

  const handleBackFromFraming = () => {
    setShowFraming(false);
  };

  // NÃO gerar automaticamente - esperar usuário clicar

  // Se estiver na tela de enquadramento
  if (showFraming && selectedImage) {
    return (
      <ImageFraming
        imageUrl={selectedImage}
        onFramingComplete={handleFramingComplete}
        onBack={handleBackFromFraming}
        modelType={clientTemplate === 'marisa' ? 'tradicional-marisa' : 'tradicional-nt'}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-nt-dark mb-2">
          Gerar Imagem para o Cartaz
        </h2>
        <p className="text-muted-foreground">
          Vaga: "{jobData.nomeVaga}" • Setor: {jobData.setorAtuacao}
        </p>
      </div>

      {/* Campo de sugestão de imagem */}
      {!hasGenerated && !isLoading && (
        <Card className="border-nt-light/30">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="custom-prompt" className="text-base font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-nt-light" />
                Descreva como você quer a imagem (opcional)
              </Label>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                Ex: "pessoa usando EPI completo", "mulher sorrindo", "ambiente mais claro"
              </p>
              <Textarea
                id="custom-prompt"
                placeholder="Digite aqui instruções específicas para a imagem..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="min-h-[80px]"
                maxLength={200}
              />
              <div className="text-xs text-muted-foreground mt-1 text-right">
                {customPrompt.length}/200 caracteres
              </div>
            </div>
            <Button
              onClick={generateImages}
              className="w-full bg-nt-light hover:bg-nt-light/90"
              size="lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Imagens com IA
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-nt-light mb-4" />
          <p className="text-muted-foreground">Gerando imagens personalizadas...</p>
          {customPrompt && (
            <p className="text-sm text-muted-foreground mt-2">
              Usando sua sugestão: "{customPrompt}"
            </p>
          )}
        </div>
      )}

      {/* Images Grid */}
      {!isLoading && images.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {images.map((imageUrl, index) => (
              <Card 
                key={index}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedImage === imageUrl ? 'ring-2 ring-nt-light' : ''
                }`}
                onClick={() => setSelectedImage(imageUrl)}
              >
                <CardContent className="p-0">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img
                      src={imageUrl}
                      alt={`Opção ${index + 1} para ${jobData.nomeVaga}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-sm font-medium">
                      Opção {index + 1}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Campo para nova sugestão */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <Label htmlFor="new-prompt" className="text-sm font-medium">
                Quer tentar com outra descrição?
              </Label>
              <div className="flex gap-2 mt-2">
                <Textarea
                  id="new-prompt"
                  placeholder="Ex: pessoa usando EPI, mulher sorrindo..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-[60px] flex-1"
                  maxLength={200}
                />
                <Button
                  variant="outline"
                  onClick={generateImages}
                  disabled={isLoading}
                  className="self-end"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-4">
              <Button
                onClick={handleContinue}
                disabled={!selectedImage}
                className="bg-nt-light hover:bg-nt-light/90"
                size="lg"
              >
                Continuar com Imagem Selecionada
              </Button>
            </div>
            <div className="flex justify-center">
              <Button variant="ghost" onClick={onBack}>
                Voltar ao Formulário
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && images.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Não foi possível gerar imagens no momento.
          </p>
          <Button onClick={generateImages} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      )}
    </div>
  );
};