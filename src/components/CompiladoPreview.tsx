import { useEffect, useRef } from "react";
import { CompiladoData } from "./CompiladoForm";
import logoImage from "@/assets/novo-tempo-logo-light-bg.png";
import whatsappIcon from "@/assets/whatsapp.svg";

interface CompiladoPreviewProps {
  data: CompiladoData;
}

export const CompiladoPreview = ({ data }: CompiladoPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Canvas em alta resolução (2x para exports nítidos)
    const scale = 2;
    const baseWidth = 1080;
    const baseHeight = 1350;
    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;
    
    // Escalar o contexto para manter as coordenadas originais
    ctx.scale(scale, scale);
    
    ctx.clearRect(0, 0, baseWidth, baseHeight);

    // Espaço reservado para tarja PCD (apenas se for vaga PCD)
    const topOffset = data.isPcd ? 67 : 0;

    // Fundo branco - preenche todo o canvas primeiro
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    // Desenhar tarja azul PCD no topo (apenas se for vaga PCD)
    if (data.isPcd) {
      ctx.fillStyle = '#3B5998';
      ctx.fillRect(0, 0, baseWidth, topOffset);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('*Vaga exclusiva ou afirmativa para Pessoa com Deficiência', baseWidth / 2, 43);
      ctx.textAlign = 'left';
    }

    // Lado esquerdo - conteúdo
    const leftWidth = 594;
    
    // Título "Vagas de emprego abertas"
    ctx.fillStyle = '#11332B';
    ctx.font = 'bold 72px Montserrat, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Vagas de', 72, topOffset + 180);
    ctx.fillText('emprego', 72, topOffset + 252);
    
    // "abertas" em verde com ícone de seta
    ctx.fillStyle = '#20CE90';
    ctx.fillText('abertas', 72, topOffset + 324);
    
    // Ícone de seta (down arrow) após "abertas"
    const textWidth = ctx.measureText('abertas ').width;
    ctx.beginPath();
    ctx.arc(72 + textWidth + 27, topOffset + 304, 27, 0, Math.PI * 2);
    ctx.fillStyle = '#20CE90';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 31px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('↓', 72 + textWidth + 27, topOffset + 313);
    
    ctx.textAlign = 'left';

    // Badge local e PCD
    let y = topOffset + 382;
    const local = data.cidade && data.estado ? `${data.cidade} - ${data.estado}` : '';
    if (local) {
      ctx.font = 'bold 25px Montserrat, Arial';
      const localTextMetrics = ctx.measureText(local);
      const localBadgeWidth = localTextMetrics.width + 45;
      
      ctx.fillStyle = '#20CE90';
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
    const maxTextWidth = 480;
    const maxCharsPerLine = 35;
    
    // Função para quebrar texto em linhas baseado em caracteres
    const wrapTextByChars = (text: string, maxChars: number): string[] => {
      if (text.length <= maxChars) return [text];

      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length <= maxChars) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }

      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // Vagas - usa fonte dinâmica e quebra em múltiplas linhas se necessário,
    // sempre respeitando a área segura (não invade a imagem).
    y += local ? 135 : 0;

    data.vagas.forEach((vaga) => {
      if (vaga.codigo && vaga.cargo) {
        const codigoText = `${vaga.codigo}:`;
        const cargoText = ` ${vaga.cargo}`;

        // 1) Tenta caber em UMA linha reduzindo a fonte até um mínimo legível
        let fontSize = 34;
        const minFontSizeOneLine = 24;

        ctx.font = `bold ${fontSize}px Montserrat, Arial`;
        let codigoWidth = ctx.measureText(codigoText).width;
        ctx.font = `${fontSize}px Montserrat, Arial`;
        let cargoWidth = ctx.measureText(cargoText).width;

        while (codigoWidth + cargoWidth > maxTextWidth && fontSize > minFontSizeOneLine) {
          fontSize -= 1;
          ctx.font = `bold ${fontSize}px Montserrat, Arial`;
          codigoWidth = ctx.measureText(codigoText).width;
          ctx.font = `${fontSize}px Montserrat, Arial`;
          cargoWidth = ctx.measureText(cargoText).width;
        }

        const cabeEmUmaLinha = codigoWidth + cargoWidth <= maxTextWidth;

        if (cabeEmUmaLinha) {
          // Renderiza em uma única linha
          ctx.fillStyle = '#20CE90';
          ctx.font = `bold ${fontSize}px Montserrat, Arial`;
          ctx.fillText(codigoText, 72, y);

          ctx.fillStyle = '#11332B';
          ctx.font = `${fontSize}px Montserrat, Arial`;
          ctx.fillText(cargoText, 72 + codigoWidth, y);

          y += fontSize + 12;
        } else {
          // 2) Não cabe em uma linha — quebra o cargo em múltiplas linhas com fonte legível
          fontSize = 26;
          ctx.font = `bold ${fontSize}px Montserrat, Arial`;
          codigoWidth = ctx.measureText(codigoText).width;
          ctx.font = `${fontSize}px Montserrat, Arial`;

          // Quebra o texto do cargo respeitando a largura disponível
          const wrapByWidth = (text: string, firstLineMaxWidth: number, otherLinesMaxWidth: number): string[] => {
            const words = text.trim().split(/\s+/);
            const lines: string[] = [];
            let current = '';
            let isFirst = true;

            for (const word of words) {
              const test = current ? `${current} ${word}` : word;
              const limit = isFirst ? firstLineMaxWidth : otherLinesMaxWidth;
              if (ctx.measureText(test).width <= limit) {
                current = test;
              } else {
                if (current) lines.push(current);
                current = word;
                isFirst = false;
              }
            }
            if (current) lines.push(current);
            return lines;
          };

          const firstLineAvailable = maxTextWidth - codigoWidth - 6;
          const linhas = wrapByWidth(vaga.cargo, firstLineAvailable, maxTextWidth);

          // Desenha código + primeira linha do cargo
          ctx.fillStyle = '#20CE90';
          ctx.font = `bold ${fontSize}px Montserrat, Arial`;
          ctx.fillText(codigoText, 72, y);

          ctx.fillStyle = '#11332B';
          ctx.font = `${fontSize}px Montserrat, Arial`;
          if (linhas[0]) {
            ctx.fillText(` ${linhas[0]}`, 72 + codigoWidth, y);
          }
          y += fontSize + 6;

          // Linhas subsequentes do cargo (alinhadas à esquerda da margem)
          for (let i = 1; i < linhas.length; i++) {
            ctx.fillText(linhas[i], 72, y);
            y += fontSize + 6;
          }
          y += 6;
        }
      }
    });

    // Requisitos e atividades
    y += 36;
    ctx.fillStyle = '#20CE90';
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
      
      const lines = data.requisitos.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          const lineWithBullet = line.startsWith('•') ? line : `• ${line}`;
          
          // Quebrar em linhas se ultrapassar o limite de caracteres
          if (lineWithBullet.length > maxCharsPerLine) {
            const wrappedLines = wrapTextByChars(lineWithBullet, maxCharsPerLine);
            wrappedLines.forEach((wrappedLine, idx) => {
              ctx.fillStyle = '#11332B';
              ctx.font = `${reqFontSize}px Montserrat, Arial`;
              ctx.fillText(wrappedLine, 72, y);
              y += reqFontSize + 8;
            });
          } else {
            ctx.fillStyle = '#11332B';
            ctx.font = `${reqFontSize}px Montserrat, Arial`;
            ctx.fillText(lineWithBullet, 72, y);
            y += reqFontSize + 10;
          }
        }
      });
    }

    // Badge "Envie seu currículo:"
    y = 1125;
    
    ctx.font = 'bold 25px Montserrat, Arial';
    const badgeTextMetrics = ctx.measureText('Envie seu currículo:');
    const badgeWidth = badgeTextMetrics.width + 45;
    
    ctx.fillStyle = '#20CE90';
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
      : 'novotemporh.com.br';
    
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
          <rect width="486" height="1012" fill="#f3f4f6"/>
          <text x="243" y="506" text-anchor="middle" font-family="Arial" font-size="32" fill="#9ca3af">Imagem</text>
        </svg>
      `);
      await new Promise((resolve) => {
        rightImage.onload = resolve;
      });
    }

    // Logo no topo direito
    const logo = new Image();
    logo.src = logoImage;
    await new Promise((resolve) => {
      logo.onload = resolve;
    });
    
    const logoWidth = 360;
    const logoHeight = (logoWidth * logo.height) / logo.width;
    ctx.drawImage(logo, 648, topOffset + 45, logoWidth, logoHeight);

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
