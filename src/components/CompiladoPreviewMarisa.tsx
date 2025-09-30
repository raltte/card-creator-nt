import { useEffect, useRef } from "react";
import { CompiladoData } from "./CompiladoForm";
import marisaLogo from "@/assets/marisa-logo.png";
import marisaLogoBranco from "@/assets/marisa-logo-branco.png";
import marisaTexto from "@/assets/marisa-texto.png";
import novoTempoLogo from "@/assets/novo-tempo-logo-v4.png";

interface CompiladoPreviewMarisaProps {
  data: CompiladoData;
}

export const CompiladoPreviewMarisa = ({ data }: CompiladoPreviewMarisaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCartaz = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 960;
    canvas.height = 1200;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
      const y = Math.floor(i / 4) * 240 + 20;
      ctx.drawImage(marisaLogoPattern, x, y, size, size * 0.3);
    }
    ctx.globalAlpha = 1.0;

    // Logo Novo Tempo (topo)
    const logoNT = new Image();
    logoNT.src = novoTempoLogo;
    await new Promise((resolve) => {
      logoNT.onload = resolve;
    });
    
    const ntLogoWidth = 200;
    const ntLogoHeight = (ntLogoWidth * logoNT.height) / logoNT.width;
    ctx.drawImage(logoNT, 680, 40, ntLogoWidth, ntLogoHeight);

    // Imagem principal (topo)
    let imageHeight = 420;
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

      // Desenhar imagem com cover
      const imageAspect = mainImage.width / mainImage.height;
      const canvasAspect = 960 / imageHeight;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imageAspect > canvasAspect) {
        drawHeight = imageHeight;
        drawWidth = imageHeight * imageAspect;
        offsetX = -(drawWidth - 960) / 2;
        offsetY = 0;
      } else {
        drawWidth = 960;
        drawHeight = 960 / imageAspect;
        offsetX = 0;
        offsetY = -(drawHeight - imageHeight) / 2;
      }
      
      ctx.drawImage(mainImage, offsetX, offsetY, drawWidth, drawHeight);
    }

    // Título "VEM TRABALHAR NA marisa" com imagem
    const marisaTextoImg = new Image();
    marisaTextoImg.src = marisaTexto;
    await new Promise((resolve) => {
      marisaTextoImg.onload = resolve;
      marisaTextoImg.onerror = resolve;
    });
    
    const textoWidth = 500;
    const textoHeight = (textoWidth * marisaTextoImg.height) / marisaTextoImg.width;
    ctx.drawImage(marisaTextoImg, 80, imageHeight + 40, textoWidth, textoHeight);

    // Seção de vagas
    let y = imageHeight + 40 + textoHeight + 50;
    
    // Badge com Local
    ctx.fillStyle = '#E5007E';
    ctx.beginPath();
    ctx.roundRect(80, y, 320, 50, 25);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(data.local || 'LOCAL', 240, y + 35);

    y += 80;

    // Lista de vagas
    ctx.fillStyle = '#E5007E';
    ctx.font = 'bold 20px Montserrat, Arial';
    ctx.textAlign = 'left';
    const vagas = data.vagas.slice(0, 5);
    vagas.forEach((vaga) => {
      if (vaga.codigo && vaga.cargo) {
        ctx.fillText('CÓDIGO VAGA:', 80, y);
        ctx.fillStyle = '#333333';
        ctx.font = '20px Montserrat, Arial';
        ctx.fillText(` ${vaga.codigo} - ${vaga.cargo}`, 235, y);
        ctx.fillStyle = '#E5007E';
        ctx.font = 'bold 20px Montserrat, Arial';
        y += 32;
      }
    });

    // Footer rosa
    const footerY = 1020;
    ctx.fillStyle = '#E5007E';
    ctx.fillRect(0, footerY, 960, 180);

    // Texto "Envie seu currículo"
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Envie seu currículo:', 480, footerY + 50);

    // Badge branco com email
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(240, footerY + 70, 480, 50, 25);
    ctx.fill();
    
    ctx.fillStyle = '#E5007E';
    ctx.font = 'bold 24px Montserrat, Arial';
    ctx.fillText('rh@novotemporh.com.br', 480, footerY + 103);
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