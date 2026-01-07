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
    const photoX = 420;
    const photoY = 220;
    const photoW = 620;
    const photoH = 900;
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
        
        // Calcular proporção para cobrir a área
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
      
      // Handle both string URL and File
      if (typeof data.image === 'string') {
        img.src = data.image;
      } else {
        img.src = URL.createObjectURL(data.image);
      }
    }

    // ===== TEXTOS "Vem trabalhar com a gente!" =====
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "italic 52px 'Montserrat', sans-serif";
    ctx.fillText("Vem trabalhar", 60, 120);
    
    ctx.font = "italic bold 52px 'Montserrat', sans-serif";
    ctx.fillText("com a gente!", 60, 180);

    // ===== LOGO NOVO TEMPO (desenho simplificado) =====
    // Círculo com NT
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(730, 115, 35, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.font = "bold 32px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("NT", 708, 127);
    
    // Texto "Novo Tempo"
    ctx.font = "bold 28px 'Montserrat', sans-serif";
    ctx.fillText("Novo Tempo", 780, 108);
    ctx.font = "18px 'Montserrat', sans-serif";
    ctx.fillText("Consultoria e RH", 780, 135);

    // ===== CARGO =====
    const cargo = data.cargo || "Cargo";
    ctx.font = "bold 72px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    
    // Quebrar cargo em linhas se necessário
    const cargoWords = cargo.split(" ");
    let cargoLine1 = "";
    let cargoLine2 = "";
    
    if (cargoWords.length > 2) {
      cargoLine1 = cargoWords.slice(0, 2).join(" ");
      cargoLine2 = cargoWords.slice(2).join(" ");
    } else {
      cargoLine1 = cargoWords[0] || "";
      cargoLine2 = cargoWords.slice(1).join(" ");
    }
    
    ctx.fillText(cargoLine1, 60, 320);
    if (cargoLine2) {
      ctx.fillText(cargoLine2, 60, 400);
    }

    // ===== CÓDIGO DA VAGA =====
    const codigo = data.codigo || "00000";
    ctx.font = "italic 28px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Código da vaga:", 60, 520);
    
    // Círculo/oval com código
    const codigoX = 290;
    const codigoY = 505;
    ctx.strokeStyle = "#6DD3CE"; // cyan/turquesa
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(codigoX + 50, codigoY, 60, 25, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.font = "bold 28px 'Montserrat', sans-serif";
    ctx.fillText(codigo, codigoX + 15, codigoY + 10);

    // ===== VAGA EFETIVA PARA ATUAR EM =====
    const tipoContrato = data.tipoContrato || "Vaga efetiva";
    ctx.font = "bold 28px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(tipoContrato, 60, 620);
    ctx.font = "28px 'Montserrat', sans-serif";
    ctx.fillText(" para atuar em:", 60 + ctx.measureText(tipoContrato).width, 620);

    // ===== LOCAL (pill com borda rosa) =====
    const local = data.cidade || "Cidade - UF";
    const localPillX = 50;
    const localPillY = 650;
    const localPillW = 350;
    const localPillH = 50;
    
    ctx.strokeStyle = "#E8A4A4"; // rosa claro
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(localPillX, localPillY, localPillW, localPillH, 25);
    ctx.stroke();
    
    ctx.font = "bold 28px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(local, localPillX + 25, localPillY + 35);

    // ===== CAIXA INSCREVA-SE =====
    const inscrevaseBoxX = 50;
    const inscrevaseBoxY = 750;
    const inscrevaseBoxW = 420;
    const inscrevaseBoxH = 130;
    
    // Fundo cyan claro
    ctx.fillStyle = "#A8E6E2";
    ctx.beginPath();
    ctx.roundRect(inscrevaseBoxX, inscrevaseBoxY, inscrevaseBoxW, inscrevaseBoxH, 15);
    ctx.fill();
    
    // Texto "Inscreva-se em:"
    ctx.font = "24px 'Montserrat', sans-serif";
    ctx.fillStyle = "#1E4FD8";
    ctx.fillText("Inscreva-se em:", inscrevaseBoxX + 20, inscrevaseBoxY + 35);
    
    // Pill com site
    const sitePillX = inscrevaseBoxX + 15;
    const sitePillY = inscrevaseBoxY + 55;
    const sitePillW = 390;
    const sitePillH = 55;
    
    ctx.strokeStyle = "#1E4FD8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(sitePillX, sitePillY, sitePillW, sitePillH, 27);
    ctx.stroke();
    
    ctx.font = "bold 28px 'Montserrat', sans-serif";
    ctx.fillStyle = "#1E4FD8";
    ctx.fillText("novotemporh.com.br", sitePillX + 35, sitePillY + 38);

    // ===== ESTRELA DECORATIVA (rosa) =====
    const starX = 530;
    const starY = 1150;
    const starSize = 60;
    
    ctx.fillStyle = "#E8A4A4";
    ctx.beginPath();
    // Desenhar estrela de 4 pontas
    ctx.moveTo(starX, starY - starSize);
    ctx.quadraticCurveTo(starX, starY, starX + starSize, starY);
    ctx.quadraticCurveTo(starX, starY, starX, starY + starSize);
    ctx.quadraticCurveTo(starX, starY, starX - starSize, starY);
    ctx.quadraticCurveTo(starX, starY, starX, starY - starSize);
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