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
    
    // Cargo (onde está escrito "Líder de Vendas")
    const cargoText = data.cargo || 'Nome da Vaga';
    const maxCargoLength = 17;
    
    // Ajustar tamanho da fonte baseado no comprimento do texto
    let cargoFontSize = 52;
    if (cargoText.length > maxCargoLength) {
      // Reduzir proporcionalmente ao tamanho extra
      cargoFontSize = Math.max(30, 52 * (maxCargoLength / cargoText.length));
    }
    
    ctx.fillStyle = '#E5007E';
    ctx.font = `bold ${cargoFontSize}px Montserrat, Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(cargoText, 480, 820);

    // Badges dinâmicos
    const badgeY = 855; // Posição Y ajustada (mais acima)
    const badgePadding = 20;
    const badgeHeight = 40;
    const badgeRadius = 20;
    const gapBetweenBadges = 30;

    // Medir texto do tipo de contrato
    ctx.font = 'bold 20px Montserrat, Arial';
    const tipoContratoText = data.tipoContrato || 'Tipo de Contrato';
    const tipoContratoWidth = ctx.measureText(tipoContratoText).width;
    const badge1Width = tipoContratoWidth + (badgePadding * 2);

    // Medir texto do local
    const localText = data.local || 'Local';
    const localWidth = ctx.measureText(localText).width;
    const badge2Width = localWidth + (badgePadding * 2);

    // Calcular posições centralizadas
    const totalWidth = badge1Width + gapBetweenBadges + badge2Width;
    const startX = (960 - totalWidth) / 2;

    const badge1X = startX;
    const badge1CenterX = badge1X + badge1Width / 2;
    
    const badge2X = badge1X + badge1Width + gapBetweenBadges;
    const badge2CenterX = badge2X + badge2Width / 2;

    // Desenhar badge 1 (rosa - tipo de contrato)
    ctx.fillStyle = '#E5007E';
    ctx.beginPath();
    ctx.roundRect(badge1X, badgeY, badge1Width, badgeHeight, badgeRadius);
    ctx.fill();

    // Texto do badge 1 (branco)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tipoContratoText, badge1CenterX, badgeY + badgeHeight / 2);

    // Desenhar seta entre os badges
    const arrowX = badge1X + badge1Width + (gapBetweenBadges / 2);
    const arrowY = badgeY + badgeHeight / 2;
    const arrowSize = 8;
    
    ctx.fillStyle = '#E5007E';
    ctx.beginPath();
    ctx.moveTo(arrowX - arrowSize, arrowY - arrowSize);
    ctx.lineTo(arrowX + arrowSize, arrowY);
    ctx.lineTo(arrowX - arrowSize, arrowY + arrowSize);
    ctx.closePath();
    ctx.fill();

    // Desenhar badge 2 (branco - local)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(badge2X, badgeY, badge2Width, badgeHeight, badgeRadius);
    ctx.fill();

    // Texto do badge 2 (rosa)
    ctx.fillStyle = '#E5007E';
    ctx.font = 'bold 20px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(localText, badge2CenterX, badgeY + badgeHeight / 2);

    // Footer - texto dinâmico baseado no tipo de contato
    const footerText = data.contato?.tipo === 'whatsapp'
      ? data.contato.valor || '(xx) xxxxx-xxxx'
      : data.contato?.tipo === 'email'
      ? data.contato.valor || 'email@exemplo.com'
      : 'novotemporh.com.br/marisa';
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(footerText, 480, 962);
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
