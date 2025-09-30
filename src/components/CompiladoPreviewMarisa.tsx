import { useEffect, useRef } from "react";
import { CompiladoData } from "./CompiladoForm";
import marisaLogo from "@/assets/marisa-logo.png";
import marisaLogoBranco from "@/assets/marisa-logo-branco.png";
import marisaTexto from "@/assets/marisa-texto.png";
import novoTempoLogo from "@/assets/novo-tempo-logo-light-bg.png";

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

    // Padrão de 'm' no background (rosa claro)
    const marisaLogoPattern = new Image();
    marisaLogoPattern.src = marisaLogoBranco;
    await new Promise((resolve) => {
      marisaLogoPattern.onload = resolve;
      marisaLogoPattern.onerror = resolve;
    });

    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 20; i++) {
      const size = 100 + (i % 3) * 40;
      const x = (i % 4) * 240 - 40;
      const y = Math.floor(i / 4) * 240 + topOffset;
      ctx.drawImage(marisaLogoPattern, x, y, size, size * 0.3);
    }
    ctx.globalAlpha = 1.0;

    // Lado esquerdo - conteúdo
    const leftWidth = 528;
    
    // Título "Vagas de emprego abertas" usando imagem Marisa
    const marisaTextoImg = new Image();
    marisaTextoImg.src = marisaTexto;
    await new Promise((resolve) => {
      marisaTextoImg.onload = resolve;
      marisaTextoImg.onerror = resolve;
    });
    
    const textoWidth = 400;
    const textoHeight = (textoWidth * marisaTextoImg.height) / marisaTextoImg.width;
    ctx.drawImage(marisaTextoImg, 64, topOffset + 120, textoWidth, textoHeight);

    // Badge local e PCD - posicionar após a imagem do texto com margem
    let y = topOffset + 120 + textoHeight + 40;
    if (data.local) {
      ctx.fillStyle = '#E5007E';
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

    // Vagas - Fonte 30px com espaçamento adequado
    y += data.local ? 60 : 40;
    data.vagas.forEach((vaga, index) => {
      if (vaga.codigo && vaga.cargo) {
        ctx.fillStyle = '#E5007E';
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

    // Requisitos - Fonte 26px
    y += 32;
    ctx.fillStyle = '#E5007E';
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

    // Badge "Envie seu currículo:" - Fonte 22px
    y = 1000;
    ctx.fillStyle = '#E5007E';
    ctx.beginPath();
    ctx.roundRect(64, y, 280, 48, 24);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Envie seu currículo:', 204, y + 30);
    ctx.textAlign = 'left';

    // Contato direto - Fonte 26px
    y += 80;
    ctx.fillStyle = '#11332B';
    ctx.font = 'bold 26px Montserrat, Arial';
    ctx.fillText(getContactDisplay(), 64, y);

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
          <rect width="432" height="900" fill="#FFC0E5"/>
          <text x="216" y="450" text-anchor="middle" font-family="Arial" font-size="32" fill="#E5007E">Imagem</text>
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
    
    const logoWidth = 320;
    const logoHeight = (logoWidth * logoNT.height) / logoNT.width;
    ctx.drawImage(logoNT, 576, topOffset + 40, logoWidth, logoHeight);

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