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

    // Configurar canvas 4:5 (1080x1350)
    canvas.width = 1080;
    canvas.height = 1350;
    
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
      const canvasAspect = 1080 / 1350;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imageAspect > canvasAspect) {
        drawHeight = 1350;
        drawWidth = 1350 * imageAspect;
        offsetX = -(drawWidth - 1080) / 2;
        offsetY = 0;
      } else {
        drawWidth = 1080;
        drawHeight = 1080 / imageAspect;
        offsetX = 0;
        offsetY = -(drawHeight - 1350) / 2;
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
    
    ctx.drawImage(fundoMarisa, 0, 0, 1080, 1350);

    // Posicionar textos sobre o PNG conforme referência
    
    // Cargo (onde está escrito "Líder de Vendas")
    const cargoText = data.cargo || 'Nome da Vaga';
    const maxWidth = 550; // Área segura horizontal
    const baseFontSize = 58;
    const minFontSize = 32;
    const lineHeight = 52; // Espaçamento entre linhas
    
    ctx.fillStyle = '#E5007E';
    ctx.textAlign = 'center';
    
    // Função para quebrar texto em linhas com fonte específica
    const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
      ctx.font = `bold ${fontSize}px Montserrat, Arial`;
      
      // Se cabe em uma linha, retorna
      if (ctx.measureText(text).width <= maxWidth) {
        return [text];
      }
      
      // Quebrar em linhas
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = word;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines.slice(0, 2); // Máximo 2 linhas
    };
    
    // Encontrar o tamanho de fonte ideal
    let fontSize = baseFontSize;
    ctx.font = `bold ${fontSize}px Montserrat, Arial`;
    
    // Primeiro: tentar reduzir fonte para caber em uma linha
    while (ctx.measureText(cargoText).width > maxWidth && fontSize > minFontSize) {
      fontSize -= 1;
      ctx.font = `bold ${fontSize}px Montserrat, Arial`;
    }
    
    // Se ainda não couber em uma linha, quebrar em duas
    let lines: string[];
    if (ctx.measureText(cargoText).width > maxWidth) {
      // Voltar para uma fonte maior e quebrar em 2 linhas
      fontSize = Math.min(baseFontSize - 10, 48);
      ctx.font = `bold ${fontSize}px Montserrat, Arial`;
      
      // Reduzir fonte até cada linha caber
      lines = wrapText(cargoText, maxWidth, fontSize);
      while (lines.some(line => ctx.measureText(line).width > maxWidth) && fontSize > minFontSize) {
        fontSize -= 1;
        ctx.font = `bold ${fontSize}px Montserrat, Arial`;
        lines = wrapText(cargoText, maxWidth, fontSize);
      }
    } else {
      lines = [cargoText];
    }
    
    ctx.font = `bold ${fontSize}px Montserrat, Arial`;
    
    // Posicionar linhas centralizadas verticalmente
    const startY = 922 - ((lines.length - 1) * lineHeight / 2);
    
    lines.forEach((line, index) => {
      ctx.fillText(line, 540, startY + (index * lineHeight));
    });

    // Badges dinâmicos
    const badgeY = 962;
    const badgePadding = 22;
    const badgeHeight = 45;
    const badgeRadius = 22;
    const gapBetweenBadges = 34;

    // Medir texto do tipo de contrato
    ctx.font = 'bold 22px Montserrat, Arial';
    const tipoContratoText = data.tipoContrato || 'Tipo de Contrato';
    const tipoContratoWidth = ctx.measureText(tipoContratoText).width;
    const badge1Width = tipoContratoWidth + (badgePadding * 2);

    // Medir texto do local
    const localText = data.local || 'Local';
    const localWidth = ctx.measureText(localText).width;
    const badge2Width = localWidth + (badgePadding * 2);

    // Calcular posições centralizadas
    const totalWidth = badge1Width + gapBetweenBadges + badge2Width;
    const startX = (1080 - totalWidth) / 2;

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
    ctx.font = 'bold 22px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tipoContratoText, badge1CenterX, badgeY + badgeHeight / 2);

    // Desenhar seta entre os badges
    const arrowX = badge1X + badge1Width + (gapBetweenBadges / 2);
    const arrowY = badgeY + badgeHeight / 2;
    const arrowSize = 9;
    
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
    ctx.font = 'bold 22px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(localText, badge2CenterX, badgeY + badgeHeight / 2);

    // Footer - texto dinâmico baseado no tipo de contato
    if (data.contato?.tipo === 'whatsapp') {
      const whatsappNumber = data.contato.valor || '(xx) xxxxx-xxxx';
      const baseText = 'Candidate-se em:';
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 29px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      
      // Medir texto base
      const baseTextWidth = ctx.measureText(baseText).width;
      const numberWidth = ctx.measureText(whatsappNumber).width;
      const iconSize = 34;
      const spacing = 11;
      
      // Calcular posição inicial para centralizar tudo
      const totalWidth = baseTextWidth + spacing + iconSize + spacing + numberWidth;
      const startX = (1080 - totalWidth) / 2;
      
      // Desenhar texto "Candidate-se em:"
      ctx.textAlign = 'left';
      ctx.fillText(baseText, startX, 1082);
      
      // Carregar e desenhar ícone do WhatsApp
      const whatsappIcon = new Image();
      whatsappIcon.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="white" d="m17.507 14.307-.009.075c-2.199-1.096-2.429-1.242-2.713-.816-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.293-.506.32-.578.878-1.634.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.576-.05-.997-.042-1.368.344-1.614 1.774-1.207 3.604.174 5.55 2.714 3.552 4.16 4.206 6.804 5.114.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345z"/>
          <path fill="white" d="m20.52 3.449c-7.689-7.433-20.414-2.042-20.419 8.444 0 2.096.549 4.14 1.595 5.945l-1.696 6.162 6.335-1.652c7.905 4.27 17.661-1.4 17.665-10.449 0-3.176-1.24-6.165-3.495-8.411zm1.482 8.417c-.006 7.633-8.385 12.4-15.012 8.504l-.36-.214-3.75.975 1.005-3.645-.239-.375c-4.124-6.565.614-15.145 8.426-15.145 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99z"/>
        </svg>
      `);
      await new Promise((resolve) => {
        whatsappIcon.onload = resolve;
        whatsappIcon.onerror = resolve;
      });
      
      const iconX = startX + baseTextWidth + spacing;
      const iconY = 1082 - iconSize + 6;
      ctx.drawImage(whatsappIcon, iconX, iconY, iconSize, iconSize);
      
      // Desenhar número do WhatsApp
      ctx.fillText(whatsappNumber, iconX + iconSize + spacing, 1082);
    } else {
      const footerText = data.contato?.tipo === 'email'
        ? data.contato.valor || 'email@exemplo.com'
        : 'novotemporh.com.br/marisa';
      
      // Calcular fonte dinâmica para e-mails longos
      const maxWidth = 900;
      let fontSize = 29;
      ctx.font = `bold ${fontSize}px Montserrat, Arial`;
      
      while (ctx.measureText(footerText).width > maxWidth && fontSize > 18) {
        fontSize -= 1;
        ctx.font = `bold ${fontSize}px Montserrat, Arial`;
      }
      
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(footerText, 540, 1082);
    }
  };

  useEffect(() => {
    drawCartaz();
  }, [data]);

  return (
    <div className="cartaz-container bg-white shadow-lg overflow-hidden">
      <canvas 
        ref={canvasRef}
        id="cartaz-canvas"
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};
