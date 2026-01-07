import { useEffect, useRef } from "react";
import { CartazData } from "./CartazGenerator";

// Import DM Card assets
import quadradoAzul from "@/assets/dm-card/quadrado-azul.png";
import quadradoBranco from "@/assets/dm-card/quadrado-branco.png";
import vemTrabalhar from "@/assets/dm-card/vem-trabalhar-2.png";
import estrela from "@/assets/dm-card/estrela-3.png";
import circuloNumero from "@/assets/dm-card/circulo-numero-vaga-3.png";

interface CartazPreviewDMCardProps {
  data: CartazData;
}

export const CartazPreviewDMCard = ({ data }: CartazPreviewDMCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Helper to draw rounded rectangle
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

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

    try {
      // Load all overlay images
      const [quadradoAzulImg, quadradoBrancoImg, vemTrabalharImg, estrelaImg, circuloImg] = await Promise.all([
        loadImage(quadradoAzul),
        loadImage(quadradoBranco),
        loadImage(vemTrabalhar),
        loadImage(estrela),
        loadImage(circuloNumero),
      ]);

      // Layer 1: Quadrado azul (cyan rectangle at bottom)
      ctx.drawImage(quadradoAzulImg, 0, 0, W, H);

      // Layer 2: Quadrado branco para imagem do usuário
      ctx.drawImage(quadradoBrancoImg, 0, 0, W, H);

      // Layer 3: User image (if available) - positioned inside white area
      if (data.image) {
        try {
          const imageSrc = typeof data.image === 'string' ? data.image : URL.createObjectURL(data.image);
          const userImg = await loadImage(imageSrc);
          
          // White rectangle area (based on the PNG placement)
          // Approximate bounds: x:430, y:135, width:600, height:780
          const imgX = 430;
          const imgY = 135;
          const imgW = 600;
          const imgH = 780;
          
          // Calculate aspect ratio to cover the area
          const imgAspect = userImg.width / userImg.height;
          const areaAspect = imgW / imgH;
          
          let drawW, drawH, drawX, drawY;
          
          if (imgAspect > areaAspect) {
            // Image is wider - fit height, crop width
            drawH = imgH;
            drawW = imgH * imgAspect;
            drawX = imgX - (drawW - imgW) / 2;
            drawY = imgY;
          } else {
            // Image is taller - fit width, crop height
            drawW = imgW;
            drawH = imgW / imgAspect;
            drawX = imgX;
            drawY = imgY - (drawH - imgH) / 2;
          }
          
          // Clip to rounded rectangle
          ctx.save();
          drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 30);
          ctx.clip();
          ctx.drawImage(userImg, drawX, drawY, drawW, drawH);
          ctx.restore();
        } catch (error) {
          console.error("Error loading user image:", error);
        }
      }

      // Layer 4: Estrela
      ctx.drawImage(estrelaImg, 0, 0, W, H);

      // Layer 5: Círculo número da vaga
      ctx.drawImage(circuloImg, 0, 0, W, H);

      // Layer 6: Vem trabalhar (texto)
      ctx.drawImage(vemTrabalharImg, 0, 0, W, H);

      // ===== DYNAMIC TEXTS =====

      // Cargo (Job title) - Large bold white text
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 72px Arial, sans-serif";
      ctx.textBaseline = "top";
      
      const cargo = data.cargo || "Cargo";
      const cargoLines = cargo.split(" ");
      let cargoY = 300;
      
      // Split cargo into 2 lines if needed
      if (cargoLines.length > 2) {
        const midPoint = Math.ceil(cargoLines.length / 2);
        const line1 = cargoLines.slice(0, midPoint).join(" ");
        const line2 = cargoLines.slice(midPoint).join(" ");
        ctx.fillText(line1, 70, cargoY);
        ctx.fillText(line2, 70, cargoY + 80);
      } else if (cargoLines.length === 2) {
        ctx.fillText(cargoLines[0], 70, cargoY);
        ctx.fillText(cargoLines[1], 70, cargoY + 80);
      } else {
        ctx.fillText(cargo, 70, cargoY);
      }

      // "Código da vaga:" + code in pill
      ctx.font = "400 32px Arial, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("Código da vaga:", 70, 540);
      
      // Code pill
      const codigo = data.codigo || "00000";
      ctx.font = "bold 32px Arial, sans-serif";
      const codigoWidth = ctx.measureText(codigo).width;
      const pillX = 290;
      const pillY = 532;
      const pillPadding = 20;
      const pillHeight = 48;
      
      // Draw pill background (semi-transparent)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, pillX, pillY, codigoWidth + pillPadding * 2, pillHeight, 24);
      ctx.stroke();
      
      // Draw code text
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(codigo, pillX + pillPadding, 540);

      // "Vaga efetiva para atuar em:"
      ctx.font = "400 32px Arial, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      const tipoContrato = data.tipoContrato === "temporario" ? "Vaga temporária" : "Vaga efetiva";
      ctx.fillText(tipoContrato + " para atuar em:", 70, 630);

      // Location pill (rounded rectangle with border)
      const local = data.cidade && data.estado ? `${data.cidade} - ${data.estado}` : "Local";
      ctx.font = "bold 36px Arial, sans-serif";
      const localWidth = ctx.measureText(local).width;
      const localPillX = 70;
      const localPillY = 680;
      const localPillPadding = 30;
      const localPillHeight = 56;
      
      // Draw location pill background
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, localPillX, localPillY, localWidth + localPillPadding * 2, localPillHeight, 28);
      ctx.stroke();
      
      // Draw location text
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(local, localPillX + localPillPadding, 692);

      // "Inscreva-se em:" (in the cyan area)
      ctx.font = "400 28px Arial, sans-serif";
      ctx.fillStyle = "#1E4FD8";
      ctx.fillText("Inscreva-se em:", 90, 1050);

      // Website URL in pill
      ctx.font = "bold 36px Arial, sans-serif";
      const website = "novotemporh.com.br";
      const websiteWidth = ctx.measureText(website).width;
      const websitePillX = 85;
      const websitePillY = 1090;
      const websitePillPadding = 25;
      const websitePillHeight = 54;
      
      // Draw website pill
      ctx.strokeStyle = "#1E4FD8";
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, websitePillX, websitePillY, websiteWidth + websitePillPadding * 2, websitePillHeight, 27);
      ctx.stroke();
      
      // Draw website text
      ctx.fillStyle = "#1E4FD8";
      ctx.fillText(website, websitePillX + websitePillPadding, 1102);

    } catch (error) {
      console.error("Error loading DM Card assets:", error);
    }
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
