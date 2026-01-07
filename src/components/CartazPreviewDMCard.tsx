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

    // Helpers de layout (baseados no PNG do template)
    const LEFT_X = 92;
    const LEFT_MAX_W = 430; // largura útil antes do bloco branco da foto

    const PHOTO = {
      x: 565,
      y: 320,
      w: 470,
      h: 750,
      r: 44,
    };

    const drawWrappedTitle = (text: string, x: number, y: number, maxW: number) => {
      // Título grande em até 2 linhas, reduzindo fonte se necessário
      let size = 92;
      let lines: string[] = [];

      const buildLines = (fontSize: number) => {
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        const words = (text || "").trim().split(/\s+/).filter(Boolean);
        const out: string[] = [];
        let current = "";

        for (const w of words) {
          const test = current ? `${current} ${w}` : w;
          if (ctx.measureText(test).width <= maxW || !current) {
            current = test;
          } else {
            out.push(current);
            current = w;
          }
        }
        if (current) out.push(current);

        if (out.length <= 2) return out;
        // Se passar de 2 linhas, junta o resto na 2ª linha
        return [out[0], out.slice(1).join(" ")];
      };

      for (; size >= 58; size -= 2) {
        const candidate = buildLines(size);
        const fits =
          candidate.length <= 2 &&
          candidate.every((l) => ctx.measureText(l).width <= maxW);
        if (fits) {
          lines = candidate;
          break;
        }
      }

      if (lines.length === 0) {
        ctx.font = "bold 72px Arial, sans-serif";
        lines = [text || "Cargo"];
      }

      const lineH = Math.round(size * 1.05);
      ctx.fillStyle = "#FFFFFF";
      ctx.textBaseline = "top";
      ctx.fillText(lines[0], x, y);
      if (lines[1]) ctx.fillText(lines[1], x, y + lineH);
    };

    try {
      // Load all overlay images
      const [
        quadradoAzulImg,
        quadradoBrancoImg,
        vemTrabalharImg,
        estrelaImg,
        circuloImg,
      ] = await Promise.all([
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
          const objectUrl =
            typeof data.image === "string" ? null : URL.createObjectURL(data.image);
          const imageSrc = typeof data.image === "string" ? data.image : objectUrl!;
          const userImg = await loadImage(imageSrc);

          // Calculate aspect ratio to cover the area
          const imgAspect = userImg.width / userImg.height;
          const areaAspect = PHOTO.w / PHOTO.h;

          let drawW: number;
          let drawH: number;
          let drawX: number;
          let drawY: number;

          if (imgAspect > areaAspect) {
            // Image is wider - fit height, crop width
            drawH = PHOTO.h;
            drawW = PHOTO.h * imgAspect;
            drawX = PHOTO.x - (drawW - PHOTO.w) / 2;
            drawY = PHOTO.y;
          } else {
            // Image is taller - fit width, crop height
            drawW = PHOTO.w;
            drawH = PHOTO.w / imgAspect;
            drawX = PHOTO.x;
            drawY = PHOTO.y - (drawH - PHOTO.h) / 2;
          }

          // Clip to rounded rectangle
          ctx.save();
          drawRoundedRect(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, PHOTO.r);
          ctx.clip();
          ctx.drawImage(userImg, drawX, drawY, drawW, drawH);
          ctx.restore();

          if (objectUrl) URL.revokeObjectURL(objectUrl);
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
      const cargo = data.cargo || "Cargo";
      drawWrappedTitle(cargo, LEFT_X, 420, LEFT_MAX_W);

      // Código da vaga
      ctx.textBaseline = "top";
      ctx.font = "400 32px Arial, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      const codigoLabel = "Código da vaga:";
      const codigoY = 640;
      ctx.fillText(codigoLabel, LEFT_X, codigoY);

      const codigo = data.codigo || "00000";
      ctx.font = "bold 32px Arial, sans-serif";
      const codigoLabelWidth = ctx.measureText(codigoLabel).width;
      const codigoWidth = ctx.measureText(codigo).width;
      const pillX = LEFT_X + codigoLabelWidth + 18;
      const pillY = codigoY - 8;
      const pillPadding = 18;
      const pillHeight = 48;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 2;
      drawRoundedRect(
        ctx,
        pillX,
        pillY,
        codigoWidth + pillPadding * 2,
        pillHeight,
        24
      );
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(codigo, pillX + pillPadding, codigoY);

      // Tipo de contrato + local
      ctx.font = "400 32px Arial, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      const tipoContrato =
        data.tipoContrato === "temporario" ? "Vaga temporária" : "Vaga efetiva";
      const tipoY = 750;
      ctx.fillText(`${tipoContrato} para atuar em:`, LEFT_X, tipoY);

      const local =
        data.cidade && data.estado ? `${data.cidade} - ${data.estado}` : "Local";
      ctx.font = "bold 36px Arial, sans-serif";
      const localWidth = ctx.measureText(local).width;
      const localPillX = LEFT_X;
      const localPillY = 810;
      const localPillPadding = 26;
      const localPillHeight = 58;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 2;
      drawRoundedRect(
        ctx,
        localPillX,
        localPillY,
        localWidth + localPillPadding * 2,
        localPillHeight,
        29
      );
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(local, localPillX + localPillPadding, localPillY + 12);

      // Inscreva-se (área ciano)
      ctx.font = "400 30px Arial, sans-serif";
      ctx.fillStyle = "#1E4FD8";
      ctx.fillText("Inscreva-se em:", LEFT_X, 1030);

      ctx.font = "bold 36px Arial, sans-serif";
      const website = "novotemporh.com.br";
      const websiteWidth = ctx.measureText(website).width;
      const websitePillX = LEFT_X;
      const websitePillY = 1075;
      const websitePillPadding = 24;
      const websitePillHeight = 58;

      ctx.strokeStyle = "#1E4FD8";
      ctx.lineWidth = 2;
      drawRoundedRect(
        ctx,
        websitePillX,
        websitePillY,
        websiteWidth + websitePillPadding * 2,
        websitePillHeight,
        29
      );
      ctx.stroke();

      ctx.fillStyle = "#1E4FD8";
      ctx.fillText(website, websitePillX + websitePillPadding, websitePillY + 12);
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
