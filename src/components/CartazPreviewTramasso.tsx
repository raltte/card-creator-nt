import { useEffect, useRef } from "react";
import { CartazData } from "./CartazGenerator";
import tramassoLogoAsset from "@/assets/tramasso-idh-logo.png.asset.json";

interface Props {
  data: CartazData;
}

const TRAMASSO_GREEN = "#B9DC28";
const TRAMASSO_DARK = "#111111";

export const CartazPreviewTramasso = ({ data }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = 2;
    const W = 1080;
    const H = 1350;
    canvas.width = W * scale;
    canvas.height = H * scale;
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, W, H);

    // ---------- background image ----------
    const bg = new Image();
    bg.crossOrigin = "anonymous";
    if (data.image) {
      bg.src = data.image instanceof File ? URL.createObjectURL(data.image) : (data.image as string);
    } else {
      bg.src =
        "data:image/svg+xml;base64," +
        btoa(
          `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'><rect width='100%' height='100%' fill='#3d3d3d'/><text x='50%' y='50%' text-anchor='middle' fill='#888' font-size='40' font-family='Arial'>Imagem da vaga</text></svg>`
        );
    }
    await new Promise((r) => {
      bg.onload = r;
      bg.onerror = r;
    });

    // cover
    const iAsp = bg.width / bg.height;
    const cAsp = W / H;
    let dw, dh, ox, oy;
    if (iAsp > cAsp) {
      dh = H;
      dw = H * iAsp;
      ox = -(dw - W) / 2;
      oy = 0;
    } else {
      dw = W;
      dh = W / iAsp;
      ox = 0;
      oy = -(dh - H) / 2;
    }
    ctx.drawImage(bg, ox, oy, dw, dh);

    // dark gradient overlay bottom for legibility
    const grad = ctx.createLinearGradient(0, H * 0.30, 0, H);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.50, "rgba(0,0,0,0.55)");
    grad.addColorStop(1, "rgba(0,0,0,0.88)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const SIDE_MARGIN = 60;
    const TOP_MARGIN = 60;

    // ---------- top-left pill "UMA OPORTUNIDADE..." ----------
    const badgePadX = 32;
    const badgePadY = 20;
    const badgeLines = ["UMA OPORTUNIDADE", "EXCLUSIVA E SELECIONADA", "POR TRAMASSOIDH"];
    ctx.font = "800 21px Montserrat, Arial";
    const badgeTextW = Math.max(...badgeLines.map((l) => ctx.measureText(l).width));
    const badgeW = badgeTextW + badgePadX * 2;
    const lineH = 26;
    const badgeH = badgeLines.length * lineH + badgePadY * 2 - 6;
    ctx.fillStyle = TRAMASSO_GREEN;
    ctx.beginPath();
    ctx.roundRect(SIDE_MARGIN, TOP_MARGIN, badgeW, badgeH, badgeH / 2);
    ctx.fill();
    ctx.fillStyle = TRAMASSO_DARK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const badgeCX = SIDE_MARGIN + badgeW / 2;
    const startY = TOP_MARGIN + badgePadY + lineH / 2 - 2;
    badgeLines.forEach((line, i) => {
      ctx.fillText(line, badgeCX, startY + i * lineH);
    });

    // ---------- top-right logo ----------
    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.src = tramassoLogoAsset.url;
    await new Promise((r) => {
      logo.onload = r;
      logo.onerror = r;
    });
    if (logo.width) {
      const logoMaxH = 130;
      const logoMaxW = 210;
      const asp = logo.width / logo.height;
      let lh = logoMaxH;
      let lw = lh * asp;
      if (lw > logoMaxW) {
        lw = logoMaxW;
        lh = lw / asp;
      }
      ctx.drawImage(logo, W - SIDE_MARGIN - lw, TOP_MARGIN - 6, lw, lh);
    }

    // ---------- Title: "Vaga para [Cargo]" ----------
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#FFFFFF";

    const wrap = (text: string, maxW: number, font: string) => {
      ctx.font = font;
      const words = text.split(" ");
      const lines: string[] = [];
      let cur = words[0] || "";
      for (let i = 1; i < words.length; i++) {
        const test = cur + " " + words[i];
        if (ctx.measureText(test).width > maxW) {
          lines.push(cur);
          cur = words[i];
        } else cur = test;
      }
      if (cur) lines.push(cur);
      return lines;
    };

    const cargoText = data.cargo || "Cargo da Vaga";
    const titleMaxW = W - SIDE_MARGIN * 2 - 20;
    let titleFont = 96;
    let cargoLines = wrap(cargoText, titleMaxW, `800 ${titleFont}px Montserrat, Arial`);
    while ((cargoLines.length > 2 || cargoLines.some((l) => ctx.measureText(l).width > titleMaxW)) && titleFont > 52) {
      titleFont -= 4;
      cargoLines = wrap(cargoText, titleMaxW, `800 ${titleFont}px Montserrat, Arial`);
    }

    const bottomBarY = H - 88;
    const buttonsY = bottomBarY - 118;
    const descBoxY = buttonsY - 104;
    const titleBottom = descBoxY - 36;
    const titleLineH = titleFont * 1.0;

    ctx.font = `800 ${titleFont}px Montserrat, Arial`;
    const allTitleLines = ["Vaga para", ...cargoLines];
    let ty = titleBottom - (allTitleLines.length - 1) * titleLineH;
    allTitleLines.forEach((line) => {
      ctx.fillText(line, W / 2, ty);
      ty += titleLineH;
    });

    // ---------- Description pill (custom text or fallback) ----------
    const rawDesc =
      (data.textoDestaque && data.textoDestaque.trim()) ||
      (data.requisitos || "")
        .split("\n")
        .map((l) => l.replace(/^•\s*/, "").trim())
        .filter(Boolean)[0] ||
      "Confira os detalhes desta oportunidade.";

    const descPillH = 76;
    const descPillY = descBoxY;
    const descPillX = SIDE_MARGIN;
    const descPillW = W - SIDE_MARGIN * 2;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(descPillX, descPillY, descPillW, descPillH, descPillH / 2);
    ctx.stroke();
    // icon circle (lime)
    const iconR = 26;
    const iconCX = descPillX + 20 + iconR;
    const iconCY = descPillY + descPillH / 2;
    ctx.fillStyle = TRAMASSO_GREEN;
    ctx.beginPath();
    ctx.arc(iconCX, iconCY, iconR, 0, Math.PI * 2);
    ctx.fill();
    // arrow down-left inside
    ctx.strokeStyle = TRAMASSO_DARK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(iconCX + 10, iconCY - 10);
    ctx.lineTo(iconCX - 10, iconCY + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(iconCX - 10, iconCY + 2);
    ctx.lineTo(iconCX - 10, iconCY + 10);
    ctx.lineTo(iconCX - 2, iconCY + 10);
    ctx.stroke();

    // desc text
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    let descFont = 26;
    const descMaxW = descPillW - (iconR * 2 + 60);
    ctx.font = `500 ${descFont}px Montserrat, Arial`;
    while (ctx.measureText(rawDesc).width > descMaxW && descFont > 16) {
      descFont -= 1;
      ctx.font = `500 ${descFont}px Montserrat, Arial`;
    }
    let shown = rawDesc;
    if (ctx.measureText(shown).width > descMaxW) {
      while (ctx.measureText(shown + "…").width > descMaxW && shown.length > 4) shown = shown.slice(0, -1);
      shown = shown + "…";
    }
    ctx.fillText(shown, iconCX + iconR + 20, iconCY);

    // ---------- Bottom row: location pill | code pill | candidate-se ----------
    const rowY = buttonsY;
    const rowH = 78;
    const gap = 20;

    // Candidate-se green pill (right side, largest)
    ctx.font = "bold 26px Montserrat, Arial";
    const ctaLabel = "Candidate-se";
    const ctaW = ctx.measureText(ctaLabel).width + 100;
    const ctaX = W - 60 - ctaW;

    // Location pill
    ctx.font = "500 24px Montserrat, Arial";
    const locText = data.local || "Cidade - UF";
    const locTextW = ctx.measureText(locText).width;
    const locW = locTextW + 90; // icon + padding
    const locX = 60;

    // Code pill (middle)
    const codeText = `Cód.: ${data.codigo || "0000"}`;
    ctx.font = "500 24px Montserrat, Arial";
    const codeTextW = ctx.measureText(codeText).width;
    const codeW = codeTextW + 90;
    const codeX = locX + locW + gap;

    // Ensure they fit
    const totalRow = locW + gap + codeW + gap + ctaW;
    const maxRow = W - 120;
    let sc = 1;
    if (totalRow > maxRow) sc = maxRow / totalRow;
    const finalLocW = locW * sc;
    const finalCodeW = codeW * sc;
    const finalCtaW = ctaW * sc;
    const finalCodeX = locX + finalLocW + gap;
    const finalCtaX = W - 60 - finalCtaW;

    const drawOutlinedPill = (x: number, y: number, w: number, h: number, iconDraw: (cx: number, cy: number) => void, text: string) => {
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, h / 2);
      ctx.stroke();
      const cy = y + h / 2;
      const cIconR = 20;
      const cIconCX = x + 22 + cIconR;
      ctx.fillStyle = TRAMASSO_GREEN;
      ctx.beginPath();
      ctx.arc(cIconCX, cy, cIconR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = TRAMASSO_DARK;
      ctx.fillStyle = TRAMASSO_DARK;
      iconDraw(cIconCX, cy);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = "500 22px Montserrat, Arial";
      ctx.fillText(text, cIconCX + cIconR + 14, cy);
    };

    // location icon (map pin)
    drawOutlinedPill(locX, rowY, finalLocW, rowH, (cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx, cy - 3, 7, Math.PI, 0, false);
      ctx.lineTo(cx, cy + 10);
      ctx.closePath();
      ctx.fill();
    }, locText);

    // code icon (magnifying glass)
    drawOutlinedPill(finalCodeX, rowY, finalCodeW, rowH, (cx, cy) => {
      ctx.lineWidth = 3;
      ctx.strokeStyle = TRAMASSO_DARK;
      ctx.beginPath();
      ctx.arc(cx - 2, cy - 2, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 4, cy + 4);
      ctx.lineTo(cx + 10, cy + 10);
      ctx.stroke();
    }, codeText);

    // Candidate-se green button
    ctx.fillStyle = TRAMASSO_GREEN;
    ctx.beginPath();
    ctx.roundRect(finalCtaX, rowY, finalCtaW, rowH, rowH / 2);
    ctx.fill();
    ctx.fillStyle = TRAMASSO_DARK;
    ctx.font = "bold 26px Montserrat, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ctaLabel, finalCtaX + finalCtaW / 2, rowY + rowH / 2);

    // ---------- Footer text ----------
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "500 24px Montserrat, Arial";
    const preText = "CADASTRE-SE EM NOSSO SITE: ";
    const siteText = "TRAMASSOIDH.COM.BR";
    const preW = ctx.measureText(preText).width;
    ctx.font = "bold 24px Montserrat, Arial";
    const siteW = ctx.measureText(siteText).width;
    const totalW = preW + siteW;
    const startX = (W - totalW) / 2;
    ctx.font = "500 24px Montserrat, Arial";
    ctx.textAlign = "left";
    ctx.fillText(preText, startX, bottomBarY + 40);
    ctx.font = "bold 24px Montserrat, Arial";
    ctx.fillStyle = TRAMASSO_GREEN;
    ctx.fillText(siteText, startX + preW, bottomBarY + 40);

    // PCD tarja
    if (data.isPcd) {
      ctx.fillStyle = "#3B5998";
      ctx.fillRect(0, 0, W, 50);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px Montserrat, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("*Vaga exclusiva ou afirmativa para Pessoa com Deficiência", W / 2, 25);
    }
  };

  useEffect(() => {
    draw();
  }, [data]);

  return (
    <div className="cartaz-container bg-white shadow-lg overflow-hidden">
      <canvas ref={canvasRef} id="cartaz-canvas" className="w-full h-full" style={{ display: "block" }} />
    </div>
  );
};
