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

    // ===== 1. FUNDO AZUL =====
    ctx.fillStyle = "#1E4FD8";
    ctx.fillRect(0, 0, W, H);

    // ===== MEDIDAS BASEADAS NA REFERÊNCIA =====
    const margin = 60;
    
    // Retângulo branco - posição e tamanho
    const photoX = 480;
    const photoY = 300;
    const photoW = W - photoX - 30; // Vai até 30px da borda direita = 570
    const photoH = 780;
    const photoRadius = 35;

    // Caixa inscreva-se - NÃO sobrepõe o branco
    const inscrevaseBoxX = margin - 10;
    const inscrevaseBoxY = photoY + photoH - 120;
    const inscrevaseBoxW = 480; // Termina antes do retângulo branco
    const inscrevaseBoxH = 145;

    // ===== 2. CAIXA INSCREVA-SE =====
    ctx.fillStyle = "#A8E6E2";
    ctx.beginPath();
    ctx.roundRect(inscrevaseBoxX, inscrevaseBoxY, inscrevaseBoxW, inscrevaseBoxH, 18);
    ctx.fill();

    // Texto "Inscreva-se em:"
    ctx.font = "26px 'Montserrat', sans-serif";
    ctx.fillStyle = "#1E4FD8";
    ctx.fillText("Inscreva-se em:", inscrevaseBoxX + 22, inscrevaseBoxY + 40);

    // Pill com site
    const sitePillX = inscrevaseBoxX + 18;
    const sitePillY = inscrevaseBoxY + 55;
    const sitePillW = 400;
    const sitePillH = 55;

    ctx.strokeStyle = "#1E4FD8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(sitePillX, sitePillY, sitePillW, sitePillH, 27);
    ctx.stroke();

    ctx.font = "bold 28px 'Montserrat', sans-serif";
    ctx.fillStyle = "#1E4FD8";
    ctx.textAlign = "center";
    ctx.fillText("novotemporh.com.br", sitePillX + sitePillW / 2, sitePillY + 38);
    ctx.textAlign = "left";

    // ===== 3. RETÂNGULO BRANCO =====
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, photoRadius);
    ctx.fill();

    // ===== 4. ESTRELA (na borda inferior esquerda do branco) =====
    const starX = inscrevaseBoxX + inscrevaseBoxW - 15;
    const starY = inscrevaseBoxY + inscrevaseBoxH - 10;
    const starSize = 45;

    ctx.fillStyle = "#E8A4A4";
    ctx.beginPath();
    ctx.moveTo(starX, starY - starSize);
    ctx.quadraticCurveTo(starX + 8, starY - 8, starX + starSize, starY);
    ctx.quadraticCurveTo(starX + 8, starY + 8, starX, starY + starSize);
    ctx.quadraticCurveTo(starX - 8, starY + 8, starX - starSize, starY);
    ctx.quadraticCurveTo(starX - 8, starY - 8, starX, starY - starSize);
    ctx.fill();

    // ===== 5. IMAGEM (se existir) =====
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

      if (typeof data.image === "string") {
        img.src = data.image;
      } else {
        img.src = URL.createObjectURL(data.image);
      }
    }

    // ===== 6. TEXTOS =====

    // "Vem trabalhar com a gente!"
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "italic 52px 'Montserrat', sans-serif";
    ctx.fillText("Vem trabalhar", margin, 95);

    ctx.font = "italic 700 52px 'Montserrat', sans-serif";
    ctx.fillText("com a gente!", margin, 158);

    // Logo Novo Tempo
    const logoX = 670;
    const logoY = 90;

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(logoX, logoY, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = "bold 32px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("NT", logoX, logoY + 11);
    ctx.textAlign = "left";

    ctx.font = "bold 28px 'Montserrat', sans-serif";
    ctx.fillText("Novo Tempo", logoX + 50, logoY - 5);
    ctx.font = "17px 'Montserrat', sans-serif";
    ctx.fillText("Consultoria e RH", logoX + 50, logoY + 20);

    // Cargo
    const cargo = data.cargo || "Cargo";
    ctx.font = "bold 70px 'Montserrat', sans-serif";
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

    ctx.fillText(cargoLine1, margin, 300);
    if (cargoLine2) {
      ctx.fillText(cargoLine2, margin, 380);
    }

    // Código da vaga
    const codigo = data.codigo || "00000";
    ctx.font = "italic 28px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Código da vaga:", margin, 490);

    const codigoTextWidth = ctx.measureText("Código da vaga:").width;
    const codigoX = margin + codigoTextWidth + 12;
    const codigoY = 490;
    const codigoW = 115;
    const codigoH = 40;

    ctx.strokeStyle = "#6DD3CE";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(codigoX, codigoY - 30, codigoW, codigoH, 20);
    ctx.stroke();

    ctx.font = "bold italic 24px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(codigo, codigoX + codigoW / 2, codigoY - 5);
    ctx.textAlign = "left";

    // Vaga efetiva para atuar em
    const tipoContrato = data.tipoContrato || "Vaga efetiva";
    ctx.font = "bold 28px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(tipoContrato, margin, 575);

    const tipoWidth = ctx.measureText(tipoContrato).width;
    ctx.font = "28px 'Montserrat', sans-serif";
    ctx.fillText(" para atuar em:", margin + tipoWidth, 575);

    // Local (pill com borda rosa)
    const local = data.cidade || "Cidade - UF";
    const localPillX = margin - 10;
    const localPillY = 610;
    const localPillW = 340;
    const localPillH = 52;

    ctx.strokeStyle = "#E8A4A4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Canto esquerdo reto, direito arredondado
    ctx.moveTo(localPillX, localPillY);
    ctx.lineTo(localPillX + localPillW - 26, localPillY);
    ctx.quadraticCurveTo(localPillX + localPillW, localPillY, localPillX + localPillW, localPillY + 26);
    ctx.quadraticCurveTo(localPillX + localPillW, localPillY + localPillH, localPillX + localPillW - 26, localPillY + localPillH);
    ctx.lineTo(localPillX, localPillY + localPillH);
    ctx.lineTo(localPillX, localPillY);
    ctx.stroke();

    ctx.font = "bold 28px 'Montserrat', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(local, localPillX + 20, localPillY + 36);
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
