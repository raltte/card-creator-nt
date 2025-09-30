import { useEffect, useRef } from "react";
import { CompiladoData } from "./CompiladoForm";
import marisaLogo from "@/assets/marisa-logo.png";
import marisaLogoBranco from "@/assets/marisa-logo-branco.png";
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

    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 15; i++) {
      const size = 80 + (i % 3) * 30;
      const x = (i % 4) * 240 - 30;
      const y = Math.floor(i / 4) * 250 + 20;
      ctx.drawImage(marisaLogoPattern, x, y, size, size * 0.3);
    }
    ctx.globalAlpha = 1.0;

    // Lado esquerdo - Informações
    let y = 100;

    // Título "VEM TRABALHAR NA"
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 42px Montserrat, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('VEM TRABALHAR NA', 60, y);
    y += 60;

    // Logo Marisa grande
    const logoMarisa = new Image();
    logoMarisa.src = marisaLogo;
    await new Promise((resolve) => {
      logoMarisa.onload = resolve;
    });
    
    const marisaWidth = 320;
    const marisaHeight = (marisaWidth * logoMarisa.height) / logoMarisa.width;
    ctx.drawImage(logoMarisa, 60, y, marisaWidth, marisaHeight);
    y += marisaHeight + 40;

    // "CONFIRA NOSSAS VAGAS" com ícone
    ctx.fillStyle = '#E5007E';
    ctx.font = 'bold 28px Montserrat, Arial';
    ctx.fillText('CONFIRA NOSSAS VAGAS', 60, y);
    
    // Ícone download
    ctx.beginPath();
    ctx.arc(370, y - 10, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('↓', 370, y - 4);
    y += 50;

    // Local
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(60, y - 25, 360, 50);
    ctx.fillStyle = '#E5007E';
    ctx.font = 'bold 26px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(data.local || 'LOCAL', 240, y + 5);
    ctx.textAlign = 'left';
    y += 60;

    // Lista de vagas
    ctx.fillStyle = '#E5007E';
    ctx.font = 'bold 22px Montserrat, Arial';
    const vagas = data.vagas.slice(0, 7);
    vagas.forEach((vaga) => {
      if (vaga.codigo && vaga.cargo) {
        ctx.fillText('CÓDIGO VAGA:', 60, y);
        ctx.fillStyle = '#333333';
        ctx.font = '22px Montserrat, Arial';
        ctx.fillText(` ${vaga.codigo} - ${vaga.cargo}`, 230, y);
        ctx.fillStyle = '#E5007E';
        ctx.font = 'bold 22px Montserrat, Arial';
        y += 35;
      }
    });

    // Logo Novo Tempo (topo direito)
    const logoNT = new Image();
    logoNT.src = novoTempoLogo;
    await new Promise((resolve) => {
      logoNT.onload = resolve;
    });
    
    const ntLogoWidth = 280;
    const ntLogoHeight = (ntLogoWidth * logoNT.height) / logoNT.width;
    ctx.drawImage(logoNT, 620, 50, ntLogoWidth, ntLogoHeight);

    // Lado direito - Imagem com background rosa arredondado
    if (data.image) {
      const rightImage = new Image();
      rightImage.crossOrigin = 'anonymous';
      
      if (data.image instanceof File) {
        rightImage.src = URL.createObjectURL(data.image);
      } else {
        rightImage.src = data.image;
      }
      
      await new Promise((resolve) => {
        rightImage.onload = resolve;
        rightImage.onerror = resolve;
      });

      // Background rosa arredondado
      ctx.fillStyle = '#FFC0E5';
      ctx.beginPath();
      ctx.roundRect(520, 200, 380, 500, 190);
      ctx.fill();

      // Clipar para desenhar imagem dentro do círculo rosa
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(520, 200, 380, 500, 190);
      ctx.clip();

      const imgAspect = rightImage.width / rightImage.height;
      const targetAspect = 380 / 500;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imgAspect > targetAspect) {
        drawHeight = 500;
        drawWidth = 500 * imgAspect;
        offsetX = 520 - (drawWidth - 380) / 2;
        offsetY = 200;
      } else {
        drawWidth = 380;
        drawHeight = 380 / imgAspect;
        offsetX = 520;
        offsetY = 200 - (drawHeight - 500) / 2;
      }
      
      ctx.drawImage(rightImage, offsetX, offsetY, drawWidth, drawHeight);
      ctx.restore();
    }

    // Seção "Requisitos" (inferior esquerdo)
    y = 880;
    ctx.fillStyle = '#E5007E';
    ctx.fillRect(60, y, 180, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Requisitos:', 150, y + 33);

    ctx.fillStyle = '#333333';
    ctx.font = '18px Montserrat, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Preencher requisitos aqui:', 60, y + 80);

    // Seção "Envie seu currículo" (inferior direito)
    ctx.fillStyle = '#E5007E';
    ctx.fillRect(520, y, 280, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Envie seu currículo:', 660, y + 33);

    ctx.fillStyle = '#333333';
    ctx.font = '18px Montserrat, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Currículos devem ser', 520, y + 80);
    ctx.fillText('enviados para', 520, y + 105);
    ctx.fillStyle = '#E5007E';
    ctx.font = 'bold 18px Montserrat, Arial';
    ctx.fillText('rh@novotemporh.com.br', 520, y + 130);
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