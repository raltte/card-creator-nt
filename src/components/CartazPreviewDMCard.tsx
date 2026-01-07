import { useEffect, useRef } from "react";
import { CartazData } from "./CartazGenerator";

interface CartazPreviewDMCardProps {
  data: CartazData;
}

export const CartazPreviewDMCard = ({ data }: CartazPreviewDMCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCartaz = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas 1080x1350 (4:5)
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    // Fundo azul DM Card
    ctx.fillStyle = "#1E4FD8";
    ctx.fillRect(0, 0, W, H);

    // ===== ÁREA DA FOTO (retângulo branco arredondado) =====
    // Menos largo e menos alto
    const photoX = 480;
    const photoY = 280;
    const photoW = 560;
    const photoH = 820;
    const photoRadius = 40;
    
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, photoRadius);
    ctx.fill();

    // Desenhar imagem se existir
    if (data.image) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(photoX, photoY, photoW, photoH, photoRadius);
        ctx.clip();
        
        const imgRatio = img.width / img.height;
        const areaRatio = photoW / photoH;
        let drawW, drawH, drawX, drawY;
        
        if (imgRatio > areaRatio) {
          drawH = photoH;
          drawW = drawH * imgRatio;
          drawX = photoX - (drawW - photoW) / 2;
          drawY = photoY;
        } else {
          drawW = photoW;
          drawH = drawW / imgRatio;
          drawX = photoX;
          drawY = photoY - (drawH - photoH) / 2;
        }
        
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
      };
      
      if (typeof data.image === 'string') {
        img.src = data.image;
      } else {
        img.src = URL.createObjectURL(data.image);
      }
    }

    // ===== TEXTOS "Vem trabalhar com a gente!" =====
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "italic 58px 'Montserrat', sans-serif";
    ctx.fillText("Vem trabalhar", 60, 100);
    
    ctx.font = "italic 700 58px 'Montserrat', sans-serif";
    ctx.fillText("com a gente!", 60, 170);

    // ===== LOGO NOVO TEMPO =====
    // Círculo com NT
    const logoX = 700;
    const logoY = 90;
    
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(logoX, logoY, 40, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.font = "bold 36px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("NT", logoX, logoY + 12);
    ctx.textAlign = "left";
    
    // Texto "Novo Tempo"
    ctx.font = "bold 32px 'Montserrat', sans-serif";
    ctx.fillText("Novo Tempo", logoX + 55, logoY - 5);
    ctx.font = "20px 'Montserrat', sans-serif";
    ctx.fillText("Consultoria e RH", logoX + 55, logoY + 25);

    // ===== CARGO =====
    const cargo = data.cargo || "Cargo";
    ctx.font = "bold 80px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    
    // Quebrar cargo em linhas
    const cargoWords = cargo.split(" ");
    let cargoLine1 = "";
    let cargoLine2 = "";
    
    if (cargoWords.length >= 2) {
      cargoLine1 = cargoWords.slice(0, Math.ceil(cargoWords.length / 2)).join(" ");
      cargoLine2 = cargoWords.slice(Math.ceil(cargoWords.length / 2)).join(" ");
    } else {
      cargoLine1 = cargo;
    }
    
    ctx.fillText(cargoLine1, 60, 320);
    if (cargoLine2) {
      ctx.fillText(cargoLine2, 60, 410);
    }

    // ===== CÓDIGO DA VAGA =====
    const codigo = data.codigo || "00000";
    ctx.font = "italic 32px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Código da vaga:", 60, 530);
    
    // Oval com código (contorno cyan)
    const codigoTextWidth = ctx.measureText("Código da vaga:").width;
    const codigoX = 60 + codigoTextWidth + 20;
    const codigoY = 515;
    const codigoW = 130;
    const codigoH = 45;
    
    ctx.strokeStyle = "#6DD3CE";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(codigoX, codigoY - 30, codigoW, codigoH, 22);
    ctx.stroke();
    
    ctx.font = "bold italic 28px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(codigo, codigoX + codigoW / 2, codigoY);
    ctx.textAlign = "left";

    // ===== VAGA EFETIVA PARA ATUAR EM =====
    const tipoContrato = data.tipoContrato || "Vaga efetiva";
    ctx.font = "bold 32px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(tipoContrato, 60, 620);
    
    const tipoWidth = ctx.measureText(tipoContrato).width;
    ctx.font = "32px 'Montserrat', sans-serif";
    ctx.fillText(" para atuar em:", 60 + tipoWidth, 620);

    // ===== LOCAL (pill com borda rosa - canto esquerdo reto, direito arredondado) =====
    const local = data.cidade || "Cidade - UF";
    const localPillX = 50;
    const localPillY = 660;
    const localPillW = 380;
    const localPillH = 60;
    
    // Desenhar pill com cantos mistos
    ctx.strokeStyle = "#E8A4A4";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Canto esquerdo reto, direito arredondado
    ctx.moveTo(localPillX, localPillY);
    ctx.lineTo(localPillX + localPillW - 30, localPillY);
    ctx.quadraticCurveTo(localPillX + localPillW, localPillY, localPillX + localPillW, localPillY + 30);
    ctx.quadraticCurveTo(localPillX + localPillW, localPillY + localPillH, localPillX + localPillW - 30, localPillY + localPillH);
    ctx.lineTo(localPillX, localPillY + localPillH);
    ctx.lineTo(localPillX, localPillY);
    ctx.stroke();
    
    ctx.font = "bold 32px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(local, localPillX + 25, localPillY + 42);

    // ===== CAIXA INSCREVA-SE (alinhada com base do retângulo branco) =====
    const inscrevaseBoxX = 50;
    const inscrevaseBoxY = photoY + photoH - 160; // Alinhado com a parte inferior do retângulo branco
    const inscrevaseBoxW = 500;
    const inscrevaseBoxH = 160;
    
    // Fundo cyan claro com cantos arredondados
    ctx.fillStyle = "#A8E6E2";
    ctx.beginPath();
    ctx.roundRect(inscrevaseBoxX, inscrevaseBoxY, inscrevaseBoxW, inscrevaseBoxH, 20);
    ctx.fill();
    
    // Texto "Inscreva-se em:"
    ctx.font = "28px 'Montserrat', sans-serif";
    ctx.fillStyle = "#1E4FD8";
    ctx.fillText("Inscreva-se em:", inscrevaseBoxX + 25, inscrevaseBoxY + 50);
    
    // Pill com site
    const sitePillX = inscrevaseBoxX + 20;
    const sitePillY = inscrevaseBoxY + 70;
    const sitePillW = 460;
    const sitePillH = 60;
    
    ctx.strokeStyle = "#1E4FD8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(sitePillX, sitePillY, sitePillW, sitePillH, 30);
    ctx.stroke();
    
    ctx.font = "bold 32px 'Montserrat', sans-serif";
    ctx.fillStyle = "#1E4FD8";
    ctx.textAlign = "center";
    ctx.fillText("novotemporh.com.br", sitePillX + sitePillW / 2, sitePillY + 42);
    ctx.textAlign = "left";

    // ===== ESTRELA DECORATIVA (rosa - 4 pontas) =====
    // Posicionada na borda inferior do retângulo branco
    const starX = photoX + 80;
    const starY = photoY + photoH + 30;
    const starSize = 50;
    
    ctx.fillStyle = "#E8A4A4";
    ctx.beginPath();
    ctx.moveTo(starX, starY - starSize);
    ctx.quadraticCurveTo(starX + 8, starY - 8, starX + starSize, starY);
    ctx.quadraticCurveTo(starX + 8, starY + 8, starX, starY + starSize);
    ctx.quadraticCurveTo(starX - 8, starY + 8, starX - starSize, starY);
    ctx.quadraticCurveTo(starX - 8, starY - 8, starX, starY - starSize);
    ctx.fill();
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