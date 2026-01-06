import { useEffect, useRef } from "react";
import { CartazData } from "./CartazGenerator";
import vemTrabalharImg from "@/assets/dm-card/vem-trabalhar.png";
import novoTempoLogoImg from "@/assets/dm-card/novo-tempo-logo.png";
import shapeFundoImg from "@/assets/dm-card/shape-fundo.png";
import estrelaImg from "@/assets/dm-card/estrela.png";
import circuloNumeroImg from "@/assets/dm-card/circulo-numero-vaga.png";

interface CartazPreviewDMCardProps {
  data: CartazData;
}

export const CartazPreviewDMCard = ({ data }: CartazPreviewDMCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
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

    // Carregar imagens em paralelo
    const [vemTrabalhar, novoTempoLogo, shapeFundo, estrela, circuloNumero] = await Promise.all([
      loadImage(vemTrabalharImg).catch(() => null),
      loadImage(novoTempoLogoImg).catch(() => null),
      loadImage(shapeFundoImg).catch(() => null),
      loadImage(estrelaImg).catch(() => null),
      loadImage(circuloNumeroImg).catch(() => null),
    ]);

    // Helpers
    const drawFullOverlay = (img: HTMLImageElement | null) => {
      if (!img) return;
      // Esses PNGs (enviados por você) já vêm “posicionados” num canvas 1080x1350.
      // Então desenhamos 1:1 como overlay para não distorcer nem perder alinhamento.
      ctx.drawImage(img, 0, 0, W, H);
    };

    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    };

    const wrapText = (text: string, maxWidth: number, font: string): string[] => {
      ctx.font = font;
      const words = (text || "").split(/\s+/).filter(Boolean);
      if (!words.length) return [];

      const lines: string[] = [];
      let current = words[0];
      for (let i = 1; i < words.length; i++) {
        const candidate = `${current} ${words[i]}`;
        if (ctx.measureText(candidate).width <= maxWidth) current = candidate;
        else {
          lines.push(current);
          current = words[i];
        }
      }
      lines.push(current);
      return lines;
    };

    // 1) Overlays fixos (posição perfeita)
    drawFullOverlay(vemTrabalhar);
    drawFullOverlay(circuloNumero);
    drawFullOverlay(shapeFundo);

    // 2) Logo (canto superior direito)
    if (novoTempoLogo) {
      const logoW = 380;
      const logoH = (logoW * novoTempoLogo.height) / novoTempoLogo.width;
      ctx.drawImage(novoTempoLogo, 620, 110, logoW, logoH);
    }

    // 3) Título da vaga (esquerda)
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    const titleX = 85;
    let titleY = 470;
    const titleFont = "bold 92px Montserrat, Arial";
    const titleLines = wrapText(data.cargo || "", 520, titleFont).slice(0, 3);
    ctx.font = titleFont;
    if (titleLines.length) {
      for (const line of titleLines) {
        ctx.fillText(line, titleX, titleY);
        titleY += 105;
      }
    } else {
      // Placeholder leve para não parecer “vazio”
      ctx.globalAlpha = 0.75;
      ctx.fillText("Nome da", titleX, titleY);
      ctx.fillText("Vaga", titleX, titleY + 105);
      ctx.globalAlpha = 1;
      titleY += 210;
    }

    // 4) "Código da vaga" + número (centralizado no oval)
    ctx.font = "italic 38px Georgia, serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Código da vaga:", 90, 705);

    // Centro aproximado do oval (no layout 1080x1350)
    const codigoCenterX = 420;
    const codigoCenterY = 700;
    ctx.font = "bold 40px Montserrat, Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(data.codigo || "00000", codigoCenterX, codigoCenterY + 10);
    ctx.textAlign = "left";

    // 5) "Vaga efetiva para atuar em" (mesma linha)
    const vagaY = 820;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 42px Montserrat, Arial";
    ctx.fillText("Vaga efetiva", 90, vagaY);
    const boldW = ctx.measureText("Vaga efetiva").width;
    ctx.font = "42px Montserrat, Arial";
    ctx.fillText(" para atuar em:", 90 + boldW, vagaY);

    // 6) Local (pill com borda coral)
    const local = data.local || "Cidade - UF";
    ctx.font = "bold 54px Montserrat, Arial";
    const localTextW = ctx.measureText(local).width;
    const pillX = 90;
    const pillY = 860;
    const pillH = 92;
    const pillPadX = 46;
    const pillW = Math.min(560, localTextW + pillPadX * 2);

    ctx.strokeStyle = "#F4A4A4";
    ctx.lineWidth = 5;
    drawRoundedRect(pillX, pillY, pillW, pillH, 46);
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(local, pillX + pillPadX, pillY + pillH / 2 + 4);
    ctx.textBaseline = "alphabetic";

    // 7) Área da foto (direita) - quadrado branco + miolo cinza
    const cardX = 565;
    const cardY = 250;
    const cardW = 475;
    const cardH = 655;

    ctx.fillStyle = "#FFFFFF";
    drawRoundedRect(cardX, cardY, cardW, cardH, 55);
    ctx.fill();

    // Miolo cinza (só aparece quando não tem pessoa)
    const innerPad = 65;
    const innerX = cardX + innerPad;
    const innerY = cardY + innerPad;
    const innerW = cardW - innerPad * 2;
    const innerH = cardH - innerPad * 2;

    if (!data.image) {
      ctx.fillStyle = "#E5E7EB";
      drawRoundedRect(innerX, innerY, innerW, innerH, 26);
      ctx.fill();

      ctx.fillStyle = "#9CA3AF";
      ctx.font = "32px Montserrat, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Imagem do", cardX + cardW / 2, cardY + cardH / 2 - 20);
      ctx.fillText("Profissional", cardX + cardW / 2, cardY + cardH / 2 + 30);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }

    // 8) Pessoa (ultrapassando o card)
    if (data.image && data.image !== "") {
      const personImg = new Image();
      personImg.crossOrigin = "anonymous";
      personImg.src = data.image instanceof File ? URL.createObjectURL(data.image) : data.image;

      await new Promise((resolve) => {
        personImg.onload = resolve;
        personImg.onerror = () => resolve(null);
      });

      if (personImg.complete && personImg.naturalWidth > 0) {
        const aspect = personImg.naturalWidth / personImg.naturalHeight;
        const targetH = 860; // dá a sensação de profundidade (ultrapassa em cima e embaixo)
        const targetW = targetH * aspect;

        // Posição: centraliza no card e empurra um pouco pra direita
        const centerX = cardX + cardW / 2 + 35;
        const bottomY = cardY + cardH + 120;

        const x = centerX - targetW / 2;
        const y = bottomY - targetH;

        ctx.drawImage(personImg, x, y, targetW, targetH);
      }
    }

    // 9) Textos do rodapé (sobre o shape)
    // Coordenadas aproximadas do layout (1080x1350)
    ctx.fillStyle = "#1E4FD8";
    ctx.font = "36px Montserrat, Arial";
    ctx.textAlign = "left";
    ctx.fillText("Inscreva-se em:", 90, 1025);

    const contactText =
      data.contato.tipo === "whatsapp"
        ? data.contato.valor || "(xx) xxxxx-xxxx"
        : data.contato.tipo === "email"
          ? data.contato.valor || "email@exemplo.com"
          : "novotemporh.com.br";

    ctx.font = "bold 52px Montserrat, Arial";
    ctx.fillText(contactText, 125, 1145);

    // 10) Estrela por cima de tudo
    drawFullOverlay(estrela);

    // Tarja azul PCD no topo se for vaga PCD
    if (data.isPcd) {
      ctx.fillStyle = "#3B5998";
      ctx.fillRect(0, 0, W, 67);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 22px Montserrat, Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "*Vaga exclusiva ou afirmativa para Pessoa com Deficiência",
        W / 2,
        43
      );
      ctx.textAlign = "left";
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