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

    // Margem geral
    const margin = 60;

    // ===== 1. FUNDO AZUL =====
    ctx.fillStyle = "#1E4FD8";
    ctx.fillRect(0, 0, W, H);

    // ===== DEFINIÇÕES DE POSIÇÃO =====
    // Retângulo branco - mais à direita, encostando na borda com margem pequena
    const photoW = 560;
    const photoH = 780;
    const photoX = W - photoW - 40; // Encosta na direita com 40px de margem
    const photoY = 280;
    const photoRadius = 35;

    // Caixa inscreva-se - termina ANTES do retângulo branco
    const inscrevaseBoxW = photoX + 80; // Sobrepõe levemente o retângulo branco
    const inscrevaseBoxH = 160;
    const inscrevaseBoxX = margin - 10;
    const inscrevaseBoxY = photoY + photoH - inscrevaseBoxH + 50; // Alinhada com base do branco

    // ===== 2. CAIXA INSCREVA-SE (atrás do branco) =====
    ctx.fillStyle = "#A8E6E2";
    ctx.beginPath();
    ctx.roundRect(inscrevaseBoxX, inscrevaseBoxY, inscrevaseBoxW, inscrevaseBoxH, 20);
    ctx.fill();

    // Texto "Inscreva-se em:"
    ctx.font = "28px 'Montserrat', sans-serif";
    ctx.fillStyle = "#1E4FD8";
    ctx.fillText("Inscreva-se em:", inscrevaseBoxX + 25, inscrevaseBoxY + 45);

    // Pill com site
    const sitePillX = inscrevaseBoxX + 20;
    const sitePillY = inscrevaseBoxY + 60;
    const sitePillW = Math.min(inscrevaseBoxW - 40, 420);
    const sitePillH = 60;

    ctx.strokeStyle = "#1E4FD8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(sitePillX, sitePillY, sitePillW, sitePillH, 30);
    ctx.stroke();

    ctx.font = "bold 30px 'Montserrat', sans-serif";
    ctx.fillStyle = "#1E4FD8";
    ctx.textAlign = "center";
    ctx.fillText("novotemporh.com.br", sitePillX + sitePillW / 2, sitePillY + 42);
    ctx.textAlign = "left";

    // ===== 3. RETÂNGULO BRANCO (foto) =====
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, photoRadius);
    ctx.fill();

    // ===== 4. IMAGEM (se existir) =====
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

        // Redesenhar a estrela por cima da imagem
        drawStar(ctx, photoX, photoY + photoH);
      };

      if (typeof data.image === "string") {
        img.src = data.image;
      } else {
        img.src = URL.createObjectURL(data.image);
      }
    }

    // ===== 5. ESTRELA DECORATIVA (na frente de tudo) =====
    const drawStar = (context: CanvasRenderingContext2D, pX: number, pY: number) => {
      const starX = pX + 60;
      const starY = pY - 20;
      const starSize = 50;

      context.fillStyle = "#E8A4A4";
      context.beginPath();
      context.moveTo(starX, starY - starSize);
      context.quadraticCurveTo(starX + 10, starY - 10, starX + starSize, starY);
      context.quadraticCurveTo(starX + 10, starY + 10, starX, starY + starSize);
      context.quadraticCurveTo(starX - 10, starY + 10, starX - starSize, starY);
      context.quadraticCurveTo(starX - 10, starY - 10, starX, starY - starSize);
      context.fill();
    };

    // Desenhar estrela (caso não tenha imagem)
    if (!data.image) {
      drawStar(ctx, photoX, photoY + photoH);
    }

    // ===== 6. TEXTOS =====

    // "Vem trabalhar com a gente!"
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "italic 54px 'Montserrat', sans-serif";
    ctx.fillText("Vem trabalhar", margin, 100);

    ctx.font = "italic 700 54px 'Montserrat', sans-serif";
    ctx.fillText("com a gente!", margin, 165);

    // Logo Novo Tempo
    const logoX = 680;
    const logoY = 95;

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(logoX, logoY, 38, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = "bold 34px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("NT", logoX, logoY + 12);
    ctx.textAlign = "left";

    ctx.font = "bold 30px 'Montserrat', sans-serif";
    ctx.fillText("Novo Tempo", logoX + 52, logoY - 5);
    ctx.font = "18px 'Montserrat', sans-serif";
    ctx.fillText("Consultoria e RH", logoX + 52, logoY + 22);

    // Cargo
    const cargo = data.cargo || "Cargo";
    ctx.font = "bold 72px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";

    const cargoWords = cargo.split(" ");
    let cargoLine1 = "";
    let cargoLine2 = "";

    if (cargoWords.length >= 2) {
      cargoLine1 = cargoWords.slice(0, Math.ceil(cargoWords.length / 2)).join(" ");
      cargoLine2 = cargoWords.slice(Math.ceil(cargoWords.length / 2)).join(" ");
    } else {
      cargoLine1 = cargo;
    }

    ctx.fillText(cargoLine1, margin, 310);
    if (cargoLine2) {
      ctx.fillText(cargoLine2, margin, 390);
    }

    // Código da vaga
    const codigo = data.codigo || "00000";
    ctx.font = "italic 30px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Código da vaga:", margin, 500);

    const codigoTextWidth = ctx.measureText("Código da vaga:").width;
    const codigoX = margin + codigoTextWidth + 15;
    const codigoY = 500;
    const codigoW = 120;
    const codigoH = 42;

    ctx.strokeStyle = "#6DD3CE";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(codigoX, codigoY - 32, codigoW, codigoH, 21);
    ctx.stroke();

    ctx.font = "bold italic 26px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(codigo, codigoX + codigoW / 2, codigoY - 5);
    ctx.textAlign = "left";

    // Vaga efetiva para atuar em
    const tipoContrato = data.tipoContrato || "Vaga efetiva";
    ctx.font = "bold 30px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(tipoContrato, margin, 590);

    const tipoWidth = ctx.measureText(tipoContrato).width;
    ctx.font = "30px 'Montserrat', sans-serif";
    ctx.fillText(" para atuar em:", margin + tipoWidth, 590);

    // Local (pill com borda rosa)
    const local = data.cidade || "Cidade - UF";
    const localPillX = margin - 10;
    const localPillY = 625;
    const localPillW = 360;
    const localPillH = 55;

    ctx.strokeStyle = "#E8A4A4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Canto esquerdo reto, direito arredondado
    ctx.moveTo(localPillX, localPillY);
    ctx.lineTo(localPillX + localPillW - 27, localPillY);
    ctx.quadraticCurveTo(localPillX + localPillW, localPillY, localPillX + localPillW, localPillY + 27);
    ctx.quadraticCurveTo(localPillX + localPillW, localPillY + localPillH, localPillX + localPillW - 27, localPillY + localPillH);
    ctx.lineTo(localPillX, localPillY + localPillH);
    ctx.lineTo(localPillX, localPillY);
    ctx.stroke();

    ctx.font = "bold 30px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(local, localPillX + 22, localPillY + 38);
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
        style={{ display: "block" }}
      />
    </div>
  );
};
