import { useEffect, useRef } from "react";
import { Phone, Globe, Mail, User, MessageCircle } from "lucide-react";
import { CartazData } from "./CartazGenerator";
import logoImage from "@/assets/novo-tempo-logo-v4.png";
import whatsappIcon from "@/assets/whatsapp.svg";

interface CartazPreviewProps {
  data: CartazData;
}

export const CartazPreview = ({ data }: CartazPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getContactIcon = (tipo: string) => {
    switch (tipo) {
      case 'whatsapp': return '📱';
      case 'email': return '✉️';
      case 'site': return '🌐';
      default: return '🌐';
    }
  };

  const getContactDisplay = () => {
    switch (data.contato.tipo) {
      case 'whatsapp':
        return `📱 ${data.contato.valor || '(xx) xxxxx-xxxx'}`;
      case 'email':
        return `✉️ ${data.contato.valor}`;
      case 'site':
      default:
        return '🌐 novotemporh.com.br';
    }
  };


  const drawCartaz = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas com proporção 4:5 (1080x1350)
    canvas.width = 1080;
    canvas.height = 1350;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configurações padrão
    const topOffset = 0;
    const availableHeight = 1350;
    const leftWidth = 486; // 45% de 1080

    // Lado esquerdo - imagem
    let leftImage: HTMLImageElement;
    
    if (data.image && data.image !== '') {
      leftImage = new Image();
      leftImage.crossOrigin = 'anonymous';
      
      if (data.image instanceof File) {
        leftImage.src = URL.createObjectURL(data.image);
      } else {
        leftImage.src = data.image;
      }
      
      await new Promise((resolve, reject) => {
        leftImage.onload = resolve;
        leftImage.onerror = () => {
          console.error('Erro ao carregar imagem:', data.image);
          resolve(null);
        };
      });
    } else {
      leftImage = new Image();
      leftImage.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="${leftWidth}" height="${availableHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${leftWidth}" height="${availableHeight}" fill="#f3f4f6"/>
          <text x="${leftWidth/2}" y="${availableHeight/2}" text-anchor="middle" font-family="Arial" font-size="32" fill="#9ca3af">Imagem</text>
        </svg>
      `);
      await new Promise((resolve) => {
        leftImage.onload = resolve;
      });
    }

    // Desenhar imagem do lado esquerdo com object-fit: cover
    const imageAspect = leftImage.width / leftImage.height;
    const canvasAspect = leftWidth / availableHeight;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imageAspect > canvasAspect) {
      drawHeight = availableHeight;
      drawWidth = availableHeight * imageAspect;
      offsetX = -(drawWidth - leftWidth) / 2;
      offsetY = topOffset;
    } else {
      drawWidth = leftWidth;
      drawHeight = leftWidth / imageAspect;
      offsetX = 0;
      offsetY = topOffset - (drawHeight - availableHeight) / 2;
    }
    
    ctx.drawImage(leftImage, offsetX, offsetY, drawWidth, drawHeight);

    // Lado direito - fundo verde escuro
    const rightWidth = 1080 - leftWidth;
    const rightHeight = 1134;
    ctx.fillStyle = '#11332B';
    ctx.beginPath();
    ctx.roundRect(leftWidth, topOffset, rightWidth, rightHeight, [0, 24, 0, 0]);
    ctx.fill();

    // Logo Novo Tempo
    const logo = new Image();
    logo.src = logoImage;
    await new Promise((resolve) => {
      logo.onload = resolve;
    });
    
    const contentOffset = 45;
    const contentX = leftWidth + 24;
    const logoWidth = 400;
    const logoHeight = (logoWidth * logo.height) / logo.width;
    ctx.drawImage(logo, contentX, topOffset + contentOffset + 90, logoWidth, logoHeight);

    // "Vaga de emprego" - título principal
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px Montserrat, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Vaga de', contentX, topOffset + contentOffset + 315);
    ctx.fillText('emprego', contentX, topOffset + contentOffset + 375);

    // Badge PCD ao lado do título
    if (data.isPcd) {
      const textWidth = ctx.measureText('emprego').width;
      const badgeX = contentX + textWidth + 27;
      const badgeY = topOffset + contentOffset + 343;
      
      ctx.fillStyle = '#3B5998';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, 112, 54, 27);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 27px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PCD', badgeX + 56, badgeY + 34);
      ctx.textAlign = 'left';
    }

    // Função auxiliar para quebrar texto
    const wrapText = (text: string, maxWidth: number, fontSize: string) => {
      ctx.font = fontSize;
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    // Dados da vaga
    let y = topOffset + contentOffset + 450;
    const maxTextWidth = rightWidth - 48;
    
    if (data.cargo) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 34px Montserrat, Arial';
      const cargoLines = wrapText(data.cargo, maxTextWidth, 'bold 34px Montserrat, Arial');
      cargoLines.forEach(line => {
        ctx.fillText(line, contentX, y);
        y += 40;
      });
    }
    y += 18;

    if (data.local) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 29px Montserrat, Arial';
      ctx.fillText('Local: ', contentX, y);
      
      const localWidth = ctx.measureText('Local: ').width;
      ctx.font = '29px Montserrat, Arial';
      const localLines = wrapText(data.local, maxTextWidth - localWidth, '29px Montserrat, Arial');
      localLines.forEach((line, index) => {
        if (index === 0) {
          ctx.fillText(line, contentX + localWidth, y);
        } else {
          ctx.fillText(line, contentX, y);
        }
        y += 36;
      });
    }
    y += 18;

    if (data.codigo) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 29px Montserrat, Arial';
      ctx.fillText('Código: ', contentX, y);
      
      const codigoWidth = ctx.measureText('Código: ').width;
      ctx.font = '29px Montserrat, Arial';
      ctx.fillText(data.codigo, contentX + codigoWidth, y);
    }
    y += 63;

    // Tipo de contrato
    if (data.tipoContrato) {
      ctx.fillStyle = '#20CE90';
      ctx.font = 'bold 31px Montserrat, Arial';
      ctx.fillText('Tipo de contrato:', contentX, y);
      y += 45;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '31px Montserrat, Arial';
      ctx.fillText(data.tipoContrato, contentX, y);
    }
    y += 63;

    // Requisitos
    if (data.requisitos) {
      ctx.fillStyle = '#20CE90';
      ctx.font = 'bold 31px Montserrat, Arial';
      ctx.fillText('Requisitos e atividades:', contentX, y);
      y += 49;

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '27px Montserrat, Arial';
      const lines = data.requisitos.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          const lineWithBullet = line.startsWith('•') ? line : `• ${line}`;
          const wrappedLines = wrapText(lineWithBullet, maxTextWidth, '27px Montserrat, Arial');
          wrappedLines.forEach((wrappedLine, index) => {
            const x = index === 0 ? contentX : contentX + 22;
            ctx.fillText(wrappedLine, x, y);
            y += 36;
          });
        }
      });
    }

    // "Saiba mais na legenda"
    y += 36;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '29px Montserrat, Arial';
    ctx.fillText('Saiba mais na ', contentX, y);
    
    const textWidth = ctx.measureText('Saiba mais na ').width;
    ctx.fillStyle = '#20CE90';
    ctx.font = 'bold 29px Montserrat, Arial';
    ctx.fillText('legenda.', contentX + textWidth, y);

    // Barra de contato verde claro na parte inferior
    const footerY = topOffset + rightHeight;
    const footerHeight = 1350 - footerY;
    ctx.fillStyle = '#20CE90';
    ctx.fillRect(leftWidth, footerY, rightWidth, footerHeight);

    // Texto do contato
    const footerCenterX = leftWidth + rightWidth / 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Envie seu currículo em:', footerCenterX, footerY + 67);

    // Obter informações de contato
    const contactText = data.contato.tipo === 'whatsapp' 
      ? data.contato.valor || '(xx) xxxxx-xxxx'
      : data.contato.tipo === 'email'
      ? data.contato.valor || 'email@exemplo.com'
      : 'novotemporh.com.br';
    
    const maxButtonWidth = 540;
    const iconSize = 27;
    const iconPadding = 9;
    const basePadding = 45;
    
    let contactFontSize = 27;
    ctx.font = `bold ${contactFontSize}px Montserrat, Arial`;
    let contactTextMetrics = ctx.measureText(contactText);
    let buttonWidth = iconSize + iconPadding + contactTextMetrics.width + basePadding;
    
    while (buttonWidth > maxButtonWidth && contactFontSize > 16) {
      contactFontSize -= 1;
      ctx.font = `bold ${contactFontSize}px Montserrat, Arial`;
      contactTextMetrics = ctx.measureText(contactText);
      buttonWidth = iconSize + iconPadding + contactTextMetrics.width + basePadding;
    }
    
    const buttonHeight = 54;
    const buttonY = footerY + 121;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(footerCenterX - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 27);
    ctx.fill();
    
    // Desenhar ícone se for WhatsApp
    if (data.contato.tipo === 'whatsapp') {
      const whatsappImg = new Image();
      whatsappImg.src = whatsappIcon;
      await new Promise((resolve) => {
        whatsappImg.onload = resolve;
        whatsappImg.onerror = resolve;
      });
      
      const iconX = footerCenterX - buttonWidth/2 + 22;
      const iconY = buttonY - iconSize/2;
      ctx.drawImage(whatsappImg, iconX, iconY, iconSize, iconSize);
      
      ctx.fillStyle = '#11332B';
      ctx.font = `bold ${contactFontSize}px Montserrat, Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(contactText, iconX + iconSize + iconPadding, buttonY);
    } else {
      const iconText = data.contato.tipo === 'email' ? '✉️' : '🌐';
      ctx.fillStyle = '#11332B';
      ctx.font = `bold ${contactFontSize}px Montserrat, Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(iconText + ' ' + contactText, footerCenterX, buttonY);
    }

    // Desenhar tarja azul PCD no topo se for vaga PCD
    if (data.isPcd) {
      ctx.fillStyle = '#3B5998';
      ctx.fillRect(0, 0, canvas.width, 67);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('*Vaga exclusiva ou afirmativa para Pessoa com Deficiência', canvas.width / 2, 43);
      ctx.textAlign = 'left';
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
