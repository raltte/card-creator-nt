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

    // Offset vertical quando tarja PCD está ativa (empurra tudo pra baixo)
    const PCD_BAR_H = 60;
    const pcdOffset = data.isPcd ? PCD_BAR_H : 0;

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

    // Área útil (abaixo da tarja PCD se ativa)
    const contentTop = pcdOffset;
    const contentH = H - pcdOffset;

    // cover na área útil
    const iAsp = bg.width / bg.height;
    const cAsp = W / contentH;
    let dw, dh, ox, oy;
    if (iAsp > cAsp) {
      dh = contentH;
      dw = contentH * iAsp;
      ox = -(dw - W) / 2;
      oy = contentTop;
    } else {
      dw = W;
      dh = W / iAsp;
      ox = 0;
      oy = contentTop - (dh - contentH) / 2;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, contentTop, W, contentH);
    ctx.clip();
    ctx.drawImage(bg, ox, oy, dw, dh);

    // dark gradient overlay bottom for legibility (dentro da área útil)
    const grad = ctx.createLinearGradient(0, contentTop + contentH * 0.30, 0, H);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.50, "rgba(0,0,0,0.55)");
    grad.addColorStop(1, "rgba(0,0,0,0.88)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, contentTop, W, contentH);
    ctx.restore();

    const SIDE_MARGIN = 55;
    const TOP_MARGIN = 55 + pcdOffset;

    // ---------- top-left pill "UMA OPORTUNIDADE..." ----------
    // Hierarquia: linhas 1-2 em peso semibold; "POR" leve + "TRAMASSOIDH" black
    const badgePadX = 26;
    const badgePadY = 16;
    const badgeLineH = 20;
    const badgeFontSize = 15;

    const line1 = "UMA OPORTUNIDADE";
    const line2 = "EXCLUSIVA E SELECIONADA";
    const line3a = "POR ";
    const line3b = "TRAMASSOIDH";

    ctx.font = `700 ${badgeFontSize}px Montserrat, Arial`;
    const w1 = ctx.measureText(line1).width;
    const w2 = ctx.measureText(line2).width;
    ctx.font = `600 ${badgeFontSize}px Montserrat, Arial`;
    const w3a = ctx.measureText(line3a).width;
    ctx.font = `900 ${badgeFontSize}px Montserrat, Arial`;
    const w3b = ctx.measureText(line3b).width;
    const w3 = w3a + w3b;

    const badgeTextW = Math.max(w1, w2, w3);
    const badgeW = badgeTextW + badgePadX * 2;
    const badgeH = badgeLineH * 3 + badgePadY * 2;

    ctx.fillStyle = TRAMASSO_GREEN;
    ctx.beginPath();
    ctx.roundRect(SIDE_MARGIN, TOP_MARGIN, badgeW, badgeH, badgeH / 2);
    ctx.fill();

    ctx.fillStyle = TRAMASSO_DARK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const badgeCX = SIDE_MARGIN + badgeW / 2;
    const line1Y = TOP_MARGIN + badgePadY + badgeLineH / 2;
    const line2Y = line1Y + badgeLineH;
    const line3Y = line2Y + badgeLineH;

    ctx.font = `700 ${badgeFontSize}px Montserrat, Arial`;
    ctx.fillText(line1, badgeCX, line1Y);
    ctx.fillText(line2, badgeCX, line2Y);
    // Linha 3 mista: "POR " (600) + "TRAMASSOIDH" (900)
    ctx.textAlign = "left";
    const line3StartX = badgeCX - w3 / 2;
    ctx.font = `600 ${badgeFontSize}px Montserrat, Arial`;
    ctx.fillText(line3a, line3StartX, line3Y);
    ctx.font = `900 ${badgeFontSize}px Montserrat, Arial`;
    ctx.fillText(line3b, line3StartX + w3a, line3Y);

    // ---------- top-right logo ----------
    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.src = tramassoLogoAsset.url;
    await new Promise((r) => {
      logo.onload = r;
      logo.onerror = r;
    });
    if (logo.width) {
      const logoMaxH = 105;
      const logoMaxW = 160;
      const asp = logo.width / logo.height;
      let lh = logoMaxH;
      let lw = lh * asp;
      if (lw > logoMaxW) {
        lw = logoMaxW;
        lh = lw / asp;
      }
      ctx.drawImage(logo, W - SIDE_MARGIN - lw, TOP_MARGIN - 2, lw, lh);
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
    let titleFont = 76;
    let cargoLines = wrap(cargoText, titleMaxW, `800 ${titleFont}px Montserrat, Arial`);
    while ((cargoLines.length > 2 || cargoLines.some((l) => ctx.measureText(l).width > titleMaxW)) && titleFont > 52) {
      titleFont -= 4;
      cargoLines = wrap(cargoText, titleMaxW, `800 ${titleFont}px Montserrat, Arial`);
    }

    const bottomBarY = H - 88;
    const buttonsY = bottomBarY - 118;

    // ---------- Description pill (custom text or fallback) — dinâmico ----------
    const rawDesc =
      (data.textoDestaque && data.textoDestaque.trim()) ||
      (data.requisitos || "")
        .split("\n")
        .map((l) => l.replace(/^•\s*/, "").trim())
        .filter(Boolean)[0] ||
      "Confira os detalhes desta oportunidade.";

    const descPillX = SIDE_MARGIN;
    const descPillW = W - SIDE_MARGIN * 2;
    const iconR = 26;
    const descMaxW = descPillW - (iconR * 2 + 60);

    // Ajuste dinâmico: escolhe fonte e wrap para caber em até 4 linhas
    let descFont = 26;
    let descLines: string[] = [];
    const MAX_LINES = 4;
    while (descFont >= 15) {
      descLines = wrap(rawDesc, descMaxW, `500 ${descFont}px Montserrat, Arial`);
      if (descLines.length <= MAX_LINES) break;
      descFont -= 1;
    }
    if (descLines.length > MAX_LINES) {
      descLines = descLines.slice(0, MAX_LINES);
      ctx.font = `500 ${descFont}px Montserrat, Arial`;
      let last = descLines[MAX_LINES - 1];
      while (ctx.measureText(last + "…").width > descMaxW && last.length > 4) last = last.slice(0, -1);
      descLines[MAX_LINES - 1] = last + "…";
    }

    const descLineH = descFont * 1.25;
    const descPadY = 22;
    const descPillH = Math.max(76, descLines.length * descLineH + descPadY * 2);
    const descPillY = buttonsY - 30 - descPillH;

    // Título: reposicionado dinamicamente acima do balão de destaque (um pouco mais pra cima)
    const titleBottom = descPillY - 48;
    const titleLineH = titleFont * 1.0;

    ctx.font = `800 ${titleFont}px Montserrat, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#FFFFFF";
    const allTitleLines = ["Vaga para", ...cargoLines];
    let ty = titleBottom - (allTitleLines.length - 1) * titleLineH;
    allTitleLines.forEach((line) => {
      ctx.fillText(line, W / 2, ty);
      ty += titleLineH;
    });

    // Pill outline
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(descPillX, descPillY, descPillW, descPillH, Math.min(descPillH / 2, 44));
    ctx.stroke();

    // icon circle (lime)
    const iconCX = descPillX + 20 + iconR;
    const iconCY = descPillY + descPillH / 2;
    ctx.fillStyle = TRAMASSO_GREEN;
    ctx.beginPath();
    ctx.arc(iconCX, iconCY, iconR, 0, Math.PI * 2);
    ctx.fill();
    // Ícone: seta diagonal apontando para baixo-esquerda (BRANCA)
    ctx.strokeStyle = "#FFFFFF";
    ctx.fillStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(iconCX + 9, iconCY - 9);
    ctx.lineTo(iconCX - 9, iconCY + 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(iconCX - 9, iconCY + 1);
    ctx.lineTo(iconCX - 9, iconCY + 9);
    ctx.lineTo(iconCX - 1, iconCY + 9);
    ctx.stroke();

    // desc text — múltiplas linhas centralizadas verticalmente
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `500 ${descFont}px Montserrat, Arial`;
    const textX = iconCX + iconR + 20;
    const totalTextH = descLines.length * descLineH;
    let tyd = iconCY - totalTextH / 2 + descLineH / 2;
    descLines.forEach((line) => {
      ctx.fillText(line, textX, tyd);
      tyd += descLineH;
    });

    // ---------- Bottom row: location pill | code pill | candidate-se ----------
    const rowY = buttonsY;
    const rowH = 74;
    const gap = 18;

    // Candidate-se green pill (right side, largest)
    ctx.font = "bold 24px Montserrat, Arial";
    const ctaLabel = "Candidate-se";
    const ctaW = ctx.measureText(ctaLabel).width + 90;
    const ctaX = W - SIDE_MARGIN - ctaW;

    // Location pill
    ctx.font = "500 24px Montserrat, Arial";
    const locText = data.local || "Cidade - UF";
    const locTextW = ctx.measureText(locText).width;
    const locW = locTextW + 90; // icon + padding
    const locX = SIDE_MARGIN;

    // Code pill (middle)
    const codeText = `Cód.: ${data.codigo || "0000"}`;
    ctx.font = "500 24px Montserrat, Arial";
    const codeTextW = ctx.measureText(codeText).width;
    const codeW = codeTextW + 90;
    const codeX = locX + locW + gap;

    // Ensure they fit
    const totalRow = locW + gap + codeW + gap + ctaW;
    const maxRow = W - SIDE_MARGIN * 2;
    let sc = 1;
    if (totalRow > maxRow) sc = maxRow / totalRow;
    const finalLocW = locW * sc;
    const finalCodeW = codeW * sc;
    const finalCtaW = ctaW * sc;
    const finalCodeX = locX + finalLocW + gap;
    const finalCtaX = W - SIDE_MARGIN - finalCtaW;

    const drawOutlinedPill = (x: number, y: number, w: number, h: number, iconDraw: (cx: number, cy: number) => void, text: string) => {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, h / 2);
      ctx.stroke();
      const cy = y + h / 2;
      const cIconR = 19;
      const cIconCX = x + 20 + cIconR;
      ctx.fillStyle = TRAMASSO_GREEN;
      ctx.beginPath();
      ctx.arc(cIconCX, cy, cIconR, 0, Math.PI * 2);
      ctx.fill();
      // Ícones internos em BRANCO
      ctx.strokeStyle = "#FFFFFF";
      ctx.fillStyle = "#FFFFFF";
      iconDraw(cIconCX, cy);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = "500 22px Montserrat, Arial";
      ctx.fillText(text, cIconCX + cIconR + 14, cy);
    };

    // location icon (map pin) - branco
    drawOutlinedPill(locX, rowY, finalLocW, rowH, (cx, cy) => {
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(cx, cy - 3, 7, Math.PI, 0, false);
      ctx.lineTo(cx, cy + 10);
      ctx.closePath();
      ctx.fill();
      // furo interno do pin
      ctx.fillStyle = TRAMASSO_GREEN;
      ctx.beginPath();
      ctx.arc(cx, cy - 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }, locText);

    // code icon (magnifying glass) - branco
    drawOutlinedPill(finalCodeX, rowY, finalCodeW, rowH, (cx, cy) => {
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#FFFFFF";
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
    ctx.font = "600 24px Montserrat, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ctaLabel, finalCtaX + finalCtaW / 2, rowY + rowH / 2);

    // ---------- Footer text (tudo branco, site em bold) ----------
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const preText = "CADASTRE-SE EM NOSSO SITE: ";
    const siteText = "TRAMASSOIDH.COM.BR";
    ctx.font = "500 22px Montserrat, Arial";
    const preW = ctx.measureText(preText).width;
    ctx.font = "800 22px Montserrat, Arial";
    const siteW = ctx.measureText(siteText).width;
    const totalW = preW + siteW;
    const startX = (W - totalW) / 2;
    ctx.font = "500 22px Montserrat, Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(preText, startX, bottomBarY + 46);
    ctx.font = "800 22px Montserrat, Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(siteText, startX + preW, bottomBarY + 46);

    // PCD tarja (acima da imagem, layout já foi deslocado)
    if (data.isPcd) {
      ctx.fillStyle = "#3B5998";
      ctx.fillRect(0, 0, W, PCD_BAR_H);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 22px Montserrat, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("*Vaga exclusiva ou afirmativa para Pessoa com Deficiência", W / 2, PCD_BAR_H / 2);
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
