import { useEffect, useRef } from "react";
import { CompiladoData } from "./CompiladoForm";
import marisaLogo from "@/assets/marisa-logo.png";
import marisaLogoBranco from "@/assets/marisa-logo-branco.png";
import marisaTexto from "@/assets/marisa-texto.png";
import novoTempoLogo from "@/assets/novo-tempo-logo-light-bg.png";
import whatsappIcon from "@/assets/whatsapp.svg";

interface CompiladoPreviewMarisaProps {
  data: CompiladoData;
}

export const CompiladoPreviewMarisa = ({ data }: CompiladoPreviewMarisaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getContactDisplay = () => {
    switch (data.contato.tipo) {
      case 'whatsapp':
        return `📱 ${data.contato.valor || '(xx) xxxxx-xxxx'}`;
      case 'email':
        return `✉️ ${data.contato.valor}`;
      case 'site':
      default:
        return '🌐 novotemporh.com.br/marisa';
    }
  };

  const drawCartaz = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 1080x1350
    canvas.width = 1080;
    canvas.height = 1350;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Espaço reservado para tarja PCD (apenas se for vaga PCD)
    const topOffset = data.isPcd ? 67 : 0;

    // Fundo branco - preenche todo o canvas primeiro
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar tarja azul PCD no topo (apenas se for vaga PCD)
    if (data.isPcd) {
      ctx.fillStyle = '#3B5998';
      ctx.fillRect(0, 0, canvas.width, topOffset);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('*Vaga exclusiva ou afirmativa para Pessoa com Deficiência', canvas.width / 2, 43);
      ctx.textAlign = 'left';
    }

    // Padrão de 'm' no background (rosa claro)
    const marisaLogoPattern = new Image();
    marisaLogoPattern.src = marisaLogoBranco;
    await new Promise((resolve) => {
      marisaLogoPattern.onload = resolve;
      marisaLogoPattern.onerror = resolve;
    });

    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 20; i++) {
      const size = 112 + (i % 3) * 45;
      const x = (i % 4) * 270 - 45;
      const y = Math.floor(i / 4) * 270 + topOffset;
      ctx.drawImage(marisaLogoPattern, x, y, size, size * 0.3);
    }
    ctx.globalAlpha = 1.0;

    // Lado esquerdo - conteúdo
    const leftWidth = 594;
    
    // Título "Vagas de emprego abertas" usando imagem Marisa
    const marisaTextoImg = new Image();
    marisaTextoImg.src = marisaTexto;
    await new Promise((resolve) => {
      marisaTextoImg.onload = resolve;
      marisaTextoImg.onerror = resolve;
    });
    
    const textoWidth = 450;
    const textoHeight = (textoWidth * marisaTextoImg.height) / marisaTextoImg.width;
    ctx.drawImage(marisaTextoImg, 72, topOffset + 135, textoWidth, textoHeight);

    // Badge local e PCD
    let y = topOffset + 135 + textoHeight + 45;
    const local = data.cidade && data.estado ? `${data.cidade} - ${data.estado}` : '';
    if (local) {
      ctx.font = 'bold 25px Montserrat, Arial';
      const localTextMetrics = ctx.measureText(local);
      const localBadgeWidth = localTextMetrics.width + 45;
      
      ctx.fillStyle = '#E5007E';
      ctx.beginPath();
      ctx.roundRect(72, y, localBadgeWidth, 54, 27);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(local, 72 + localBadgeWidth / 2, y + 34);
      ctx.textAlign = 'left';
      
      // Badge PCD ao lado do local
      if (data.isPcd) {
        const badgeX = 72 + localBadgeWidth + 18;
        ctx.fillStyle = '#3B5998';
        ctx.beginPath();
        ctx.roundRect(badgeX, y, 112, 54, 27);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 25px Montserrat, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PCD', badgeX + 56, y + 34);
        ctx.textAlign = 'left';
      }
    }

    // Área segura para textos (imagem começa em x=594, texto começa em x=72)
    // Margem de segurança: 594 - 72 - 100 = 422px
    const maxTextWidth = 420;
    
    // Função para quebrar texto em linhas
    const wrapTextToLines = (text: string, maxWidth: number, fontSize: number, fontWeight: string = ''): string[] => {
      ctx.font = `${fontWeight} ${fontSize}px Montserrat, Arial`.trim();
      
      if (ctx.measureText(text).width <= maxWidth) {
        return [text];
      }
      
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      return lines;
    };

    // Vagas
    y += local ? 135 : 45;
    const baseFontSize = 34;
    const minFontSize = 22;
    
    data.vagas.forEach((vaga, index) => {
      if (vaga.codigo && vaga.cargo) {
        const codigoText = `${vaga.codigo}:`;
        const fullText = `${codigoText} ${vaga.cargo}`;
        
        // Calcular fonte dinâmica
        let fontSize = baseFontSize;
        ctx.font = `bold ${fontSize}px Montserrat, Arial`;
        
        while (ctx.measureText(fullText).width > maxTextWidth && fontSize > minFontSize) {
          fontSize -= 1;
          ctx.font = `bold ${fontSize}px Montserrat, Arial`;
        }
        
        // Se ainda não couber, quebrar em linhas
        if (ctx.measureText(fullText).width > maxTextWidth) {
          const lines = wrapTextToLines(fullText, maxTextWidth, fontSize, 'bold');
          lines.forEach((line, lineIndex) => {
            // Encontrar onde termina o código na linha
            if (lineIndex === 0 && line.includes(':')) {
              const colonIndex = line.indexOf(':');
              const codePart = line.substring(0, colonIndex + 1);
              const cargoPart = line.substring(colonIndex + 1);
              
              ctx.fillStyle = '#E5007E';
              ctx.font = `bold ${fontSize}px Montserrat, Arial`;
              ctx.fillText(codePart, 72, y);
              
              const codeWidth = ctx.measureText(codePart).width;
              ctx.fillStyle = '#11332B';
              ctx.font = `${fontSize}px Montserrat, Arial`;
              ctx.fillText(cargoPart, 72 + codeWidth, y);
            } else {
              ctx.fillStyle = '#11332B';
              ctx.font = `${fontSize}px Montserrat, Arial`;
              ctx.fillText(line, 72, y);
            }
            y += fontSize + 8;
          });
        } else {
          ctx.fillStyle = '#E5007E';
          ctx.font = `bold ${fontSize}px Montserrat, Arial`;
          ctx.fillText(codigoText, 72, y);
          
          const codigoWidth = ctx.measureText(codigoText).width;
          ctx.fillStyle = '#11332B';
          ctx.font = `${fontSize}px Montserrat, Arial`;
          ctx.fillText(` ${vaga.cargo}`, 72 + codigoWidth, y);
          
          y += fontSize + 15;
        }
      }
    });

    // Requisitos e atividades
    y += 36;
    ctx.fillStyle = '#E5007E';
    ctx.beginPath();
    ctx.roundRect(72, y, 315, 54, 27);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Requisitos e atividades', 229, y + 34);
    ctx.textAlign = 'left';

    y += 90;
    if (data.requisitos) {
      const reqFontSize = 26;
      const minReqFontSize = 18;
      
      const lines = data.requisitos.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          const lineWithBullet = line.startsWith('•') ? line : `• ${line}`;
          
          // Calcular fonte dinâmica para requisitos
          let fontSize = reqFontSize;
          ctx.font = `${fontSize}px Montserrat, Arial`;
          
          while (ctx.measureText(lineWithBullet).width > maxTextWidth && fontSize > minReqFontSize) {
            fontSize -= 1;
            ctx.font = `${fontSize}px Montserrat, Arial`;
          }
          
          // Se ainda não couber, quebrar em linhas
          if (ctx.measureText(lineWithBullet).width > maxTextWidth) {
            const wrappedLines = wrapTextToLines(lineWithBullet, maxTextWidth, fontSize);
            wrappedLines.forEach((wrappedLine, idx) => {
              ctx.fillStyle = '#11332B';
              ctx.font = `${fontSize}px Montserrat, Arial`;
              ctx.fillText(wrappedLine, 72, y);
              y += fontSize + 8;
            });
          } else {
            ctx.fillStyle = '#11332B';
            ctx.font = `${fontSize}px Montserrat, Arial`;
            ctx.fillText(lineWithBullet, 72, y);
            y += fontSize + 10;
          }
        }
      });
    }

    // Badge "Envie seu currículo:"
    y = 1125;
    
    ctx.font = 'bold 25px Montserrat, Arial';
    const badgeTextMetrics = ctx.measureText('Envie seu currículo:');
    const badgeWidth = badgeTextMetrics.width + 45;
    
    ctx.fillStyle = '#E5007E';
    ctx.beginPath();
    ctx.roundRect(72, y, badgeWidth, 54, 27);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('Envie seu currículo:', 72 + badgeWidth/2, y + 34);
    ctx.textAlign = 'left';

    // Contato dinâmico com ícone
    y += 90;
    const contactValue = data.contato.tipo === 'whatsapp'
      ? data.contato.valor || '(xx) xxxxx-xxxx'
      : data.contato.tipo === 'email'
      ? data.contato.valor || 'email@exemplo.com'
      : 'novotemporh.com.br/marisa';
    
    const maxContactWidth = 472;
    let contactFontSize = 29;
    ctx.font = `bold ${contactFontSize}px Montserrat, Arial`;
    
    while (ctx.measureText(contactValue).width > maxContactWidth && contactFontSize > 18) {
      contactFontSize -= 1;
      ctx.font = `bold ${contactFontSize}px Montserrat, Arial`;
    }
    
    ctx.fillStyle = '#11332B';
    
    if (data.contato.tipo === 'whatsapp') {
      const whatsappImg = new Image();
      whatsappImg.src = whatsappIcon;
      await new Promise((resolve) => {
        whatsappImg.onload = resolve;
        whatsappImg.onerror = resolve;
      });
      
      const iconSize = contactFontSize;
      ctx.drawImage(whatsappImg, 72, y - iconSize, iconSize, iconSize);
      ctx.fillText(contactValue, 72 + iconSize + 9, y);
    } else {
      const contactIcon = data.contato.tipo === 'email' ? '✉️' : '🌐';
      ctx.fillText(`${contactIcon} ${contactValue}`, 72, y);
    }

    // Lado direito - imagem
    let rightImage: HTMLImageElement;
    
    if (data.image && data.image !== '') {
      rightImage = new Image();
      rightImage.crossOrigin = 'anonymous';
      
      if (data.image instanceof File) {
        rightImage.src = URL.createObjectURL(data.image);
      } else {
        rightImage.src = data.image;
      }
      
      await new Promise((resolve, reject) => {
        rightImage.onload = resolve;
        rightImage.onerror = () => {
          console.error('Erro ao carregar imagem:', data.image);
          resolve(null);
        };
      });
    } else {
      rightImage = new Image();
      rightImage.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="486" height="1012" xmlns="http://www.w3.org/2000/svg">
          <rect width="486" height="1012" fill="#FFC0E5"/>
          <text x="243" y="506" text-anchor="middle" font-family="Arial" font-size="32" fill="#E5007E">Imagem</text>
        </svg>
      `);
      await new Promise((resolve) => {
        rightImage.onload = resolve;
      });
    }

    // Logo Novo Tempo no topo direito
    const logoNT = new Image();
    logoNT.src = novoTempoLogo;
    await new Promise((resolve) => {
      logoNT.onload = resolve;
    });
    
    const logoWidth = 360;
    const logoHeight = (logoWidth * logoNT.height) / logoNT.width;
    ctx.drawImage(logoNT, 648, topOffset + 45, logoWidth, logoHeight);

    // Desenhar imagem no lado direito com bordas arredondadas
    const imageX = 594;
    const imageY = topOffset + logoHeight + 90;
    const imageWidth = 486;
    const imageHeight = 1012;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(imageX, imageY, imageWidth, imageHeight, 45);
    ctx.clip();

    const imageAspect = rightImage.width / rightImage.height;
    const canvasAspect = imageWidth / imageHeight;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imageAspect > canvasAspect) {
      drawHeight = imageHeight;
      drawWidth = imageHeight * imageAspect;
      offsetX = imageX - (drawWidth - imageWidth) / 2;
      offsetY = imageY;
    } else {
      drawWidth = imageWidth;
      drawHeight = imageWidth / imageAspect;
      offsetX = imageX;
      offsetY = imageY - (drawHeight - imageHeight) / 2;
    }
    
    ctx.drawImage(rightImage, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
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
