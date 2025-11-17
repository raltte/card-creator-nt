import { useEffect, useRef } from "react";
import { CompiladoData } from "./CompiladoForm";
import logoImage from "@/assets/novo-tempo-logo-light-bg.png";

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

    // Canvas 960x1200
    canvas.width = 960;
    canvas.height = 1200;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Espaço reservado para tarja PCD (sempre reservado)
    const topOffset = 60;

    // Desenhar tarja azul PCD no topo (apenas se for vaga PCD)
    if (data.isPcd) {
      ctx.fillStyle = '#3B5998';
      ctx.fillRect(0, 0, canvas.width, topOffset);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('*Vaga exclusiva ou afirmativa para Pessoa com Deficiência', canvas.width / 2, 38);
      ctx.textAlign = 'left';
    }

    // Fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, topOffset, canvas.width, canvas.height - topOffset);

    // Lado esquerdo - conteúdo
    const leftWidth = 528;
    
    // Título "Vagas de emprego abertas"
    ctx.fillStyle = '#11332B';
    ctx.font = 'bold 64px Montserrat, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Vagas de', 64, topOffset + 160);
    ctx.fillText('emprego', 64, topOffset + 224);
    
    // "abertas" em verde com ícone de seta
    ctx.fillStyle = '#20CE90';
    ctx.fillText('abertas', 64, topOffset + 288);
    
    // Ícone de seta (down arrow) após "abertas"
    const textWidth = ctx.measureText('abertas ').width;
    ctx.beginPath();
    ctx.arc(64 + textWidth + 24, topOffset + 270, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#20CE90';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('↓', 64 + textWidth + 24, topOffset + 278);
    
    ctx.textAlign = 'left';

    // Badge local e PCD - posicionar após o título com margem
    let y = topOffset + 340;
    if (data.local) {
      ctx.fillStyle = '#20CE90';
      ctx.beginPath();
      ctx.roundRect(64, y, 200, 48, 24);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText(data.local, 164, y + 30);
      ctx.textAlign = 'left';
      
      // Badge PCD ao lado do local (se for vaga PCD)
      if (data.isPcd) {
        const badgeX = 64 + 200 + 16;
        ctx.fillStyle = '#3B5998';
        ctx.beginPath();
        ctx.roundRect(badgeX, y, 100, 48, 24);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px Montserrat, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PCD', badgeX + 50, y + 30);
        ctx.textAlign = 'left';
      }
    }

    // Vagas - Fonte aumentada para 30px com espaçamento adequado após local
    y += data.local ? 120 : 0;
    data.vagas.forEach((vaga, index) => {
      if (vaga.codigo && vaga.cargo) {
        ctx.fillStyle = '#20CE90';
        ctx.font = 'bold 30px Montserrat, Arial';
        const codigoText = `${vaga.codigo}:`;
        ctx.fillText(codigoText, 64, y);
        
        const codigoWidth = ctx.measureText(codigoText).width;
        ctx.fillStyle = '#11332B';
        ctx.font = '30px Montserrat, Arial';
        ctx.fillText(` ${vaga.cargo}`, 64 + codigoWidth, y);
        
        y += 44;
      }
    });

    // Requisitos - Fonte aumentada para 26px
    y += 32;
    ctx.fillStyle = '#20CE90';
    ctx.beginPath();
    ctx.roundRect(64, y, 160, 48, 24);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Requisitos', 144, y + 30);
    ctx.textAlign = 'left';

    y += 80;
    if (data.requisitos) {
      ctx.fillStyle = '#11332B';
      ctx.font = '26px Montserrat, Arial';
      const lines = data.requisitos.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          const lineWithBullet = line.startsWith('•') ? line : `• ${line}`;
          ctx.fillText(lineWithBullet, 64, y);
          y += 34;
        }
      });
    }

    // Badge "Envie seu currículo:" - Dinâmico baseado no tamanho do texto
    y = 1000;
    
    // Medir o texto para criar badge dinâmico
    ctx.font = 'bold 22px Montserrat, Arial';
    const badgeTextMetrics = ctx.measureText('Envie seu currículo:');
    const badgeWidth = badgeTextMetrics.width + 40; // adiciona padding
    
    ctx.fillStyle = '#20CE90';
    ctx.beginPath();
    ctx.roundRect(64, y, badgeWidth, 48, 24);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('Envie seu currículo:', 64 + badgeWidth/2, y + 30);
    ctx.textAlign = 'left';

    // Contato dinâmico com ícone - Fonte aumentada para 26px
    y += 80;
    const contactIcon = data.contato.tipo === 'whatsapp' ? '📱' 
      : data.contato.tipo === 'email' ? '✉️' 
      : '🌐';
    const contactValue = data.contato.tipo === 'whatsapp'
      ? data.contato.valor || '(xx) xxxxx-xxxx'
      : data.contato.tipo === 'email'
      ? data.contato.valor || 'email@exemplo.com'
      : 'novotemporh.com.br';
    
    ctx.fillStyle = '#11332B';
    ctx.font = 'bold 26px Montserrat, Arial';
    ctx.fillText(`${contactIcon} ${contactValue}`, 64, y);

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
        <svg width="432" height="900" xmlns="http://www.w3.org/2000/svg">
          <rect width="432" height="900" fill="#f3f4f6"/>
          <text x="216" y="450" text-anchor="middle" font-family="Arial" font-size="32" fill="#9ca3af">Imagem</text>
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
    
    const logoWidth = 320;
    const logoHeight = (logoWidth * logo.height) / logo.width;
    ctx.drawImage(logo, 576, topOffset + 40, logoWidth, logoHeight);

    // Desenhar imagem no lado direito com todas as bordas arredondadas
    const imageX = 528;
    const imageY = topOffset + logoHeight + 80;
    const imageWidth = 432;
    const imageHeight = 900;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(imageX, imageY, imageWidth, imageHeight, 40);
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