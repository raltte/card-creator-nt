import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageSelectorProps {
  jobData: {
    nomeVaga: string;
    setorAtuacao: string;
    tipoContrato: string;
    requisitos: string[];
  };
  onImageSelect: (imageUrl: string) => void;
  onBack: () => void;
}

export const ImageSelector = ({ jobData, onImageSelect, onBack }: ImageSelectorProps) => {
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const generateImages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-job-images', {
        body: {
          jobTitle: jobData.nomeVaga,
          sector: jobData.setorAtuacao,
          contractType: jobData.tipoContrato,
          requirements: jobData.requisitos,
        }
      });

      if (error) throw error;

      if (data.images && data.images.length > 0) {
        setImages(data.images);
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
      onImageSelect(selectedImage);
    }
  };

  // Gerar imagens automaticamente quando o componente é montado
  React.useEffect(() => {
    generateImages();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-nt-dark mb-2">
          Selecione a Imagem Ideal
        </h2>
        <p className="text-muted-foreground">
          Baseado nas informações da vaga "{jobData.nomeVaga}", geramos estas opções de imagem para o seu cartaz
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-nt-light mb-4" />
          <p className="text-muted-foreground">Gerando imagens personalizadas...</p>
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

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={generateImages}
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar Mais Opções
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!selectedImage}
                className="bg-nt-light hover:bg-nt-light/90"
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