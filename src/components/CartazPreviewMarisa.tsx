import { useEffect, useRef } from "react";
import { CartazData } from "./CartazGenerator";
import marisaFundo from "@/assets/marisa-fundo.png";

interface CartazPreviewMarisaProps {
  data: CartazData;
}

export const CartazPreviewMarisa = ({ data }: CartazPreviewMarisaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCartaz = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas 4:5 (960x1200)
    canvas.width = 960;
    canvas.height = 1200;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Carregar e desenhar imagem principal
    if (data.image) {
      const mainImage = new Image();
      mainImage.crossOrigin = 'anonymous';
      
      if (data.image instanceof File) {
        mainImage.src = URL.createObjectURL(data.image);
      } else {
        mainImage.src = data.image;
      }
      
      await new Promise((resolve) => {
        mainImage.onload = resolve;
        mainImage.onerror = resolve;
      });

      // Desenhar imagem ocupando todo o espaço (com cover)
      const imageAspect = mainImage.width / mainImage.height;
      const canvasAspect = 960 / 1200;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imageAspect > canvasAspect) {
        drawHeight = 1200;
        drawWidth = 1200 * imageAspect;
        offsetX = -(drawWidth - 960) / 2;
        offsetY = 0;
      } else {
        drawWidth = 960;
        drawHeight = 960 / imageAspect;
        offsetX = 0;
        offsetY = -(drawHeight - 1200) / 2;
      }
      
      ctx.drawImage(mainImage, offsetX, offsetY, drawWidth, drawHeight);
    }

    // Carregar e desenhar PNG de fundo com logos e elementos
    const fundoMarisa = new Image();
    fundoMarisa.src = marisaFundo;
    await new Promise((resolve) => {
      fundoMarisa.onload = resolve;
      fundoMarisa.onerror = resolve;
    });
    
    ctx.drawImage(fundoMarisa, 0, 0, 960, 1200);

    // Posicionar textos sobre o PNG conforme referência
    
    // Cargo (onde está "Líder de Vendas")
    ctx.fillStyle = '#E5007E';
    ctx.font = 'bold 52px Montserrat, Arial';
    ctx.textAlign = 'center';
    const cargoText = data.cargo || 'Nome da Vaga';
    ctx.fillText(cargoText, 480, 820);

    // Tipo de contrato (badge rosa à esquerda - "Vaga efetiva")
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(data.tipoContrato, 377, 888);

    // Local (badge branco à direita - "São Paulo - SP")
    ctx.fillStyle = '#E5007E';
    ctx.fillText(data.local || 'Local', 553, 888);

    // Footer - texto
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('novotemporh.com.br/marisa', 490, 1000);
  };

  useEffect(() => {
    drawCartaz();
  }, [data]);

  return (
    <div className="cartaz-container bg-white rounded-lg shadow-lg overflow-hidden">
      <canvas 
        ref={canvasRef}
        id="cartaz-canvas"
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};