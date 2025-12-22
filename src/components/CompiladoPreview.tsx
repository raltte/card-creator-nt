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

    // Canvas 1080x1350
    canvas.width = 1080;
    canvas.height = 1350;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Espaço reservado para tarja PCD
    const topOffset = 67;

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

    // Fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, topOffset, canvas.width, canvas.height - topOffset);

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
      ctx.fillStyle = '#20CE90';
      ctx.beginPath();
      ctx.roundRect(72, y, 225, 54, 27);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 25px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText(local, 184, y + 34);
      ctx.textAlign = 'left';
      
      // Badge PCD ao lado do local
      if (data.isPcd) {
        const badgeX = 72 + 225 + 18;
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

    // Vagas
    y += local ? 135 : 0;
    data.vagas.forEach((vaga, index) => {
      if (vaga.codigo && vaga.cargo) {
        ctx.fillStyle = '#20CE90';
        ctx.font = 'bold 34px Montserrat, Arial';
        const codigoText = `${vaga.codigo}:`;
        ctx.fillText(codigoText, 72, y);
        
        const codigoWidth = ctx.measureText(codigoText).width;
        ctx.fillStyle = '#11332B';
        ctx.font = '34px Montserrat, Arial';
        ctx.fillText(` ${vaga.cargo}`, 72 + codigoWidth, y);
        
        y += 49;
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
      ctx.fillStyle = '#11332B';
      ctx.font = '29px Montserrat, Arial';
      const lines = data.requisitos.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          const lineWithBullet = line.startsWith('•') ? line : `• ${line}`;
          ctx.fillText(lineWithBullet, 72, y);
          y += 38;
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
