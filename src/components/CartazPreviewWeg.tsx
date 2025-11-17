import { useEffect, useRef } from "react";
import { CartazData } from "./CartazGenerator";
import whatsappIcon from "@/assets/whatsapp.svg";

interface CartazPreviewWegProps {
  data: CartazData;
}

export const CartazPreviewWeg = ({ data }: CartazPreviewWegProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCartaz = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas com proporção 4:5 (960x1200)
    canvas.width = 960;
    canvas.height = 1200;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const topOffset = 0;
    const availableHeight = 1200;

    // Lado esquerdo - imagem (45% da largura)
    let leftImage: HTMLImageElement;
    
    if (data.image && data.image !== '') {
      leftImage = new Image();
      leftImage.crossOrigin = 'anonymous';
      
      if (data.image instanceof File) {
        leftImage.src = URL.createObjectURL(data.image);
      } else {
        leftImage.src = data.image;
      }
      
      await new Promise((resolve) => {
        leftImage.onload = resolve;
        leftImage.onerror = () => {
          console.error('Erro ao carregar imagem:', data.image);
          resolve(null);
        };
      });
    } else {
      // Imagem padrão quando não há imagem
      leftImage = new Image();
      leftImage.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="432" height="${availableHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="432" height="${availableHeight}" fill="#f3f4f6"/>
          <text x="216" y="${availableHeight/2}" text-anchor="middle" font-family="Arial" font-size="32" fill="#9ca3af">Imagem</text>
        </svg>
      `);
      await new Promise((resolve) => {
        leftImage.onload = resolve;
      });
    }

    // Desenhar imagem do lado esquerdo com object-fit: cover
    const imageAspect = leftImage.width / leftImage.height;
    const canvasAspect = 432 / availableHeight;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imageAspect > canvasAspect) {
      drawHeight = availableHeight;
      drawWidth = availableHeight * imageAspect;
      offsetX = -(drawWidth - 432) / 2;
      offsetY = topOffset;
    } else {
      drawWidth = 432;
      drawHeight = 432 / imageAspect;
      offsetX = 0;
      offsetY = topOffset - (drawHeight - availableHeight) / 2;
    }
    
    ctx.drawImage(leftImage, offsetX, offsetY, drawWidth, drawHeight);

    // Lado direito - fundo azul WEG (#2B5BA0)
    const rightHeight = 1008;
    ctx.fillStyle = '#2B5BA0';
    ctx.beginPath();
    ctx.roundRect(432, topOffset, 528, rightHeight, [0, 24, 0, 0]);
    ctx.fill();

    // Logos WEG & NT (topo direito) - placeholder como SVG inline
    const wegLogo = new Image();
    wegLogo.src = 'data:image/svg+xml;base64,' + btoa(`
      <svg width="300" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="20" width="120" height="40" fill="white" rx="4"/>
        <text x="70" y="47" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#2B5BA0">WEG</text>
        <text x="150" y="47" font-family="Arial, sans-serif" font-size="28" fill="white">&amp;</text>
        <circle cx="220" cy="40" r="30" stroke="white" stroke-width="3" fill="none"/>
        <text x="220" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">NT</text>
      </svg>
    `);
    await new Promise((resolve) => {
      wegLogo.onload = resolve;
      wegLogo.onerror = resolve;
    });
    ctx.drawImage(wegLogo, 480, 40, 300, 80);

    // Caixa de conteúdo branca arredondada
    const boxX = 480;
    const boxY = 160;
    const boxWidth = 400;
    const boxHeight = 680;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 16);
    ctx.fill();

    // "Vaga de emprego" - preto, negrito
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Vaga de', boxX + 32, boxY + 60);
    ctx.fillText('emprego', boxX + 32, boxY + 115);

    // Job title
    const jobTitle = data.cargo || 'Nome da Vaga';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 26px Arial, sans-serif';
    
    // Quebrar texto se necessário
    const maxWidth = boxWidth - 64;
    const words = jobTitle.split(' ');
    let line = '';
    let y = boxY + 170;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, boxX + 32, y);
        line = words[n] + ' ';
        y += 32;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, boxX + 32, y);
    y += 10;

    // Local
    ctx.fillStyle = '#000000';
    ctx.font = '18px Arial, sans-serif';
    ctx.fillText(`Local: ${data.local || 'Cidade - Estado'}`, boxX + 32, y + 30);

    // Código em badge azul
    const codigoY = y + 60;
    const codigoText = `Código: ${data.codigo || '00000'}`;
    ctx.font = 'bold 18px Arial, sans-serif';
    const codigoWidth = ctx.measureText(codigoText).width;
    
    ctx.fillStyle = '#2B5BA0';
    ctx.beginPath();
    ctx.roundRect(boxX + 32, codigoY, codigoWidth + 24, 32, 16);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(codigoText, boxX + 44, codigoY + 22);

    // Tipo de contrato
    const contratoY = codigoY + 60;
    ctx.fillStyle = '#2B5BA0';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText('Tipo de contrato:', boxX + 32, contratoY);
    
    ctx.fillStyle = '#000000';
    ctx.font = '18px Arial, sans-serif';
    ctx.fillText(data.tipoContrato || 'Tipo de Contrato', boxX + 32, contratoY + 28);

    // Requisitos e atividades
    const reqY = contratoY + 70;
    ctx.fillStyle = '#2B5BA0';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText('Requisitos e atividades:', boxX + 32, reqY);
    
    // Requisitos (primeiras linhas)
    const requisitos = data.requisitos?.split('\n').slice(0, 3) || ['• Ensino fundamental completo', '• Experiência na função'];
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial, sans-serif';
    let reqLineY = reqY + 28;
    
    requisitos.forEach((req) => {
      ctx.fillText(req, boxX + 32, reqLineY);
      reqLineY += 24;
    });

    // "Saiba mais na legenda"
    const legendaY = boxY + boxHeight - 40;
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial, sans-serif';
    const saibaMaisText = 'Saiba mais na ';
    const saibaMaisWidth = ctx.measureText(saibaMaisText).width;
    ctx.fillText(saibaMaisText, boxX + 32, legendaY);
    
    ctx.fillStyle = '#2B5BA0';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('legenda.', boxX + 32 + saibaMaisWidth, legendaY);

    // Footer preto com WhatsApp
    const footerY = 880;
    const footerHeight = 190;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(432, footerY, 528, footerHeight);

    // "Envie seu currículo em:"
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Envie seu currículo em:', 696, footerY + 50);

    // Badge branco com WhatsApp
    if (data.contato?.tipo === 'whatsapp') {
      const badgeY = footerY + 80;
      const badgeHeight = 50;
      const phoneNumber = data.contato.valor || '(xx) xxxxx-xxxx';
      
      // Medir largura do badge
      ctx.font = 'bold 20px Arial, sans-serif';
      const iconSize = 30;
      const spacing = 12;
      const numberWidth = ctx.measureText(phoneNumber).width;
      const badgeWidth = iconSize + spacing + numberWidth + 40;
      
      // Desenhar badge branco
      const badgeX = 696 - badgeWidth / 2;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 25);
      ctx.fill();
      
      // Ícone WhatsApp
      const whatsappImg = new Image();
      whatsappImg.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="#25D366" d="m17.507 14.307-.009.075c-2.199-1.096-2.429-1.242-2.713-.816-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.293-.506.32-.578.878-1.634.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.576-.05-.997-.042-1.368.344-1.614 1.774-1.207 3.604.174 5.55 2.714 3.552 4.16 4.206 6.804 5.114.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345z"/>
          <path fill="#25D366" d="m20.52 3.449c-7.689-7.433-20.414-2.042-20.419 8.444 0 2.096.549 4.14 1.595 5.945l-1.696 6.162 6.335-1.652c7.905 4.27 17.661-1.4 17.665-10.449 0-3.176-1.24-6.165-3.495-8.411zm1.482 8.417c-.006 7.633-8.385 12.4-15.012 8.504l-.36-.214-3.75.975 1.005-3.645-.239-.375c-4.124-6.565.614-15.145 8.426-15.145 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99z"/>
        </svg>
      `);
      await new Promise((resolve) => {
        whatsappImg.onload = resolve;
        whatsappImg.onerror = resolve;
      });
      
      const iconX = badgeX + 20;
      const iconY = badgeY + (badgeHeight - iconSize) / 2;
      ctx.drawImage(whatsappImg, iconX, iconY, iconSize, iconSize);
      
      // Número
      ctx.fillStyle = '#2B5BA0';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(phoneNumber, iconX + iconSize + spacing, badgeY + badgeHeight / 2 + 7);
    } else {
      // Email ou site
      const contactText = data.contato?.tipo === 'email' 
        ? data.contato.valor 
        : 'novotemporh.com.br';
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(contactText, 696, footerY + 120);
    }
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
