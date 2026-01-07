import { useEffect, useRef } from "react";
import { CartazData } from "./CartazGenerator";

// Import DM Card assets
import quadradoAzul from "@/assets/dm-card/quadrado-azul.png";
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
      const [quadradoImg, vemTrabalharImg, estrelaImg, circuloImg] = await Promise.all([
        loadImage(quadradoAzul),
        loadImage(vemTrabalhar),
        loadImage(estrela),
        loadImage(circuloNumero),
      ]);

      // Draw each image at full canvas size (they're already 1080x1350 with correct placement)
      ctx.drawImage(quadradoImg, 0, 0, W, H);
      ctx.drawImage(vemTrabalharImg, 0, 0, W, H);
      ctx.drawImage(estrelaImg, 0, 0, W, H);
      ctx.drawImage(circuloImg, 0, 0, W, H);

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
