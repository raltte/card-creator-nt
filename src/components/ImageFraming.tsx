import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageFramingProps {
  imageUrl: string;
  onFramingComplete: (croppedImageData: string) => void;
  onBack: () => void;
}

export const ImageFraming = ({ imageUrl, onFramingComplete, onBack }: ImageFramingProps) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [imagePos, setImagePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState([100]);

  // Dimensões da área de recorte (proporção do cartaz)
  const CROP_WIDTH = 432;
  const CROP_HEIGHT = 1200;
  const CANVAS_SCALE = 0.3; // Escala para visualização
  const DISPLAY_WIDTH = CROP_WIDTH * CANVAS_SCALE;
  const DISPLAY_HEIGHT = CROP_HEIGHT * CANVAS_SCALE;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      // Centralizar a imagem inicialmente
      const canvas = canvasRef.current;
      if (canvas) {
        // Calcular posição inicial para centralizar
        const imageAspect = img.width / img.height;
        const cropAspect = CROP_WIDTH / CROP_HEIGHT;
        
        let initialScale;
        if (imageAspect > cropAspect) {
          // Imagem mais larga - ajustar pela altura
          initialScale = CROP_HEIGHT / img.height;
        } else {
          // Imagem mais alta - ajustar pela largura
          initialScale = CROP_WIDTH / img.width;
        }
        
        const scaledWidth = img.width * initialScale;
        const scaledHeight = img.height * initialScale;
        
        setImagePos({
          x: (CROP_WIDTH - scaledWidth) / 2,
          y: (CROP_HEIGHT - scaledHeight) / 2
        });
      }
    };
    img.onerror = () => {
      toast({
        title: "Erro",
        description: "Não foi possível carregar a imagem.",
        variant: "destructive"
      });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (image && canvasRef.current) {
      drawCanvas();
    }
  }, [image, imagePos, zoom]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = DISPLAY_WIDTH;
    canvas.height = DISPLAY_HEIGHT;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar fundo escuro
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Aplicar escala de zoom
    const zoomFactor = zoom[0] / 100;
    const scaledWidth = image.width * zoomFactor;
    const scaledHeight = image.height * zoomFactor;

    // Desenhar imagem na posição ajustada e com zoom
    ctx.drawImage(
      image,
      (imagePos.x * CANVAS_SCALE),
      (imagePos.y * CANVAS_SCALE),
      scaledWidth * CANVAS_SCALE,
      scaledHeight * CANVAS_SCALE
    );

    // Desenhar bordas da área de recorte
    ctx.strokeStyle = '#20CE90';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

    // Desenhar linhas de guia (regra dos terços)
    ctx.strokeStyle = '#20CE90';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Linhas verticais
    ctx.beginPath();
    ctx.moveTo(DISPLAY_WIDTH / 3, 0);
    ctx.lineTo(DISPLAY_WIDTH / 3, DISPLAY_HEIGHT);
    ctx.moveTo((DISPLAY_WIDTH * 2) / 3, 0);
    ctx.lineTo((DISPLAY_WIDTH * 2) / 3, DISPLAY_HEIGHT);
    
    // Linhas horizontais
    ctx.moveTo(0, DISPLAY_HEIGHT / 3);
    ctx.lineTo(DISPLAY_WIDTH, DISPLAY_HEIGHT / 3);
    ctx.moveTo(0, (DISPLAY_HEIGHT * 2) / 3);
    ctx.lineTo(DISPLAY_WIDTH, (DISPLAY_HEIGHT * 2) / 3);
    ctx.stroke();
    
    ctx.setLineDash([]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = (e.clientX - lastMousePos.x) / CANVAS_SCALE;
    const deltaY = (e.clientY - lastMousePos.y) / CANVAS_SCALE;

    setImagePos(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetPosition = () => {
    if (!image) return;
    
    const imageAspect = image.width / image.height;
    const cropAspect = CROP_WIDTH / CROP_HEIGHT;
    
    let initialScale;
    if (imageAspect > cropAspect) {
      initialScale = CROP_HEIGHT / image.height;
    } else {
      initialScale = CROP_WIDTH / image.width;
    }
    
    const scaledWidth = image.width * initialScale;
    const scaledHeight = image.height * initialScale;
    
    setImagePos({
      x: (CROP_WIDTH - scaledWidth) / 2,
      y: (CROP_HEIGHT - scaledHeight) / 2
    });
    setZoom([100]);
  };

  const handleComplete = () => {
    if (!image || !canvasRef.current) return;

    // Criar canvas final com as dimensões reais
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = CROP_WIDTH;
    finalCanvas.height = CROP_HEIGHT;
    const ctx = finalCanvas.getContext('2d');
    
    if (!ctx) return;

    // Aplicar recorte com a posição e zoom atuais
    const zoomFactor = zoom[0] / 100;
    const scaledWidth = image.width * zoomFactor;
    const scaledHeight = image.height * zoomFactor;

    ctx.drawImage(
      image,
      imagePos.x,
      imagePos.y,
      scaledWidth,
      scaledHeight
    );

    // Converter para base64
    const croppedImageData = finalCanvas.toDataURL('image/png', 1.0);
    onFramingComplete(croppedImageData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-nt-dark mb-2">
          Ajustar Enquadramento
        </h2>
        <p className="text-muted-foreground">
          Arraste a imagem e ajuste o zoom para posicionar o elemento principal no centro
        </p>
      </div>

      {/* Canvas de edição */}
      <div className="flex justify-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="border-2 border-nt-light rounded-lg cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ touchAction: 'none' }}
          />
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            Área do cartaz
          </div>
        </div>
      </div>

      {/* Controles */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Zoom */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ZoomOut className="w-4 h-4" />
                <span className="text-sm font-medium">Zoom: {zoom[0]}%</span>
                <ZoomIn className="w-4 h-4" />
              </div>
              <Slider
                value={zoom}
                onValueChange={setZoom}
                min={50}
                max={200}
                step={5}
                className="w-full"
              />
            </div>

            {/* Instruções */}
            <div className="text-sm text-muted-foreground">
              <p>• Arraste a imagem para reposicionar</p>
              <p>• Use o zoom para ajustar o tamanho</p>
              <p>• As linhas verdes mostram a regra dos terços para melhor composição</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de ação */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={resetPosition}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar Posição
          </Button>
          <Button
            onClick={handleComplete}
            className="bg-nt-light hover:bg-nt-light/90"
          >
            Aplicar Enquadramento
          </Button>
        </div>
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar à Seleção de Imagem
          </Button>
        </div>
      </div>
    </div>
  );
};