import { useEffect, useRef } from "react";
import { CartazData } from "./CartazGenerator";
import marisaLogo from "@/assets/marisa-logo.png";
import marisaLogoBranco from "@/assets/marisa-logo-branco.png";
import novoTempoLogo from "@/assets/novo-tempo-logo-v4.png";

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

    // Background com padrão de 'm' da Marisa
    ctx.fillStyle = '#E5E5E5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar padrão de 'm' no background
    const marisaLogoPattern = new Image();
    marisaLogoPattern.src = marisaLogoBranco;
    await new Promise((resolve) => {
      marisaLogoPattern.onload = resolve;
      marisaLogoPattern.onerror = resolve;
    });

    // Desenhar múltiplos 'm' com opacidade e tamanhos variados
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 8; i++) {
      const size = 120 + (i % 3) * 40;
      const x = (i % 3) * 200 - 50;
      const y = Math.floor(i / 3) * 200 + 50;
      ctx.drawImage(marisaLogoPattern, x, y, size, size * 0.3);
    }
    ctx.globalAlpha = 1.0;

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

    // Card branco central com informações
    const cardY = 680;
    const cardHeight = 240;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(200, cardY, 560, cardHeight, 24);
    ctx.fill();

    // Logo Marisa no card (rosa)
    const logoMarisa = new Image();
    logoMarisa.src = marisaLogo;
    await new Promise((resolve) => {
      logoMarisa.onload = resolve;
    });
    
    // Badge rosa com logo
    ctx.fillStyle = '#E5007E';
    ctx.beginPath();
    ctx.roundRect(380, cardY + 30, 200, 50, 25);
    ctx.fill();
    
    const logoWidth = 180;
    const logoHeight = (logoWidth * logoMarisa.height) / logoMarisa.width;
    ctx.drawImage(logoMarisa, 390, cardY + 40, logoWidth, logoHeight * 0.8);

    // Cargo
    ctx.fillStyle = '#E5007E';
    ctx.font = 'bold 32px Montserrat, Arial';
    ctx.textAlign = 'center';
    const cargoText = data.cargo || 'Nome da Vaga';
    ctx.fillText(cargoText, 480, cardY + 115);

    // Tipo de contrato e Local
    const contratoY = cardY + 155;
    
    // Badge tipo de contrato
    ctx.fillStyle = '#E5007E';
    ctx.beginPath();
    ctx.roundRect(240, contratoY - 15, 180, 40, 20);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(data.tipoContrato, 330, contratoY + 10);

    // Badge local
    ctx.fillStyle = '#E5007E';
    ctx.beginPath();
    ctx.roundRect(540, contratoY - 15, 180, 40, 20);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(data.local || 'Local', 630, contratoY + 10);

    // Ícone download
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(690, contratoY + 60, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('↓', 690, contratoY + 68);

    // Footer rosa
    const footerY = 960;
    ctx.fillStyle = '#E5007E';
    ctx.fillRect(0, footerY, 960, 240);

    // Texto footer
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Candidate-se em:', 480, footerY + 70);

    // Badge branco com link
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(280, footerY + 90, 400, 50, 25);
    ctx.fill();
    
    ctx.fillStyle = '#E5007E';
    ctx.font = 'bold 24px Montserrat, Arial';
    ctx.fillText('novotemporh.com.br/marisa', 480, footerY + 122);

    // Logo Novo Tempo no footer
    const logoNT = new Image();
    logoNT.src = novoTempoLogo;
    await new Promise((resolve) => {
      logoNT.onload = resolve;
    });
    
    const ntLogoWidth = 240;
    const ntLogoHeight = (ntLogoWidth * logoNT.height) / logoNT.width;
    ctx.drawImage(logoNT, 360, footerY + 160, ntLogoWidth, ntLogoHeight);
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