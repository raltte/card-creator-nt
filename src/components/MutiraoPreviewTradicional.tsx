import { useEffect, useRef } from "react";
import { MutiraoData } from "./MutiraoForm";
import logoNT from "@/assets/logo-novo-tempo-rh.png";
import whatsappIcon from "@/assets/whatsapp.svg";

interface MutiraoPreviewTradicionalProps {
  data: MutiraoData;
}

export const MutiraoPreviewTradicional = ({ data }: MutiraoPreviewTradicionalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCartaz = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 2;
    const W = 1080;
    const H = 1350;
    canvas.width = W * scale;
    canvas.height = H * scale;
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    const leftW = Math.round(W * 0.45);
    const PRIMARY = '#20CE90';

    // ── Left image ──
    if (data.image && data.image !== '') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = typeof data.image === 'string' ? data.image : URL.createObjectURL(data.image as File);
      await new Promise(r => { img.onload = r; img.onerror = r; });
      const ia = img.width / img.height, ca = leftW / H;
      let dw, dh, dx, dy;
      if (ia > ca) { dh = H; dw = H * ia; dx = -(dw - leftW) / 2; dy = 0; }
      else { dw = leftW; dh = leftW / ia; dx = 0; dy = -(dh - H) / 2; }
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, leftW, H);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '32px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Imagem', leftW / 2, H / 2);
      ctx.textAlign = 'left';
    }

    // ── Right side ──
    const rX = leftW;
    const rW = W - leftW;
    const sideMargin = 28;
    const boxX = rX + sideMargin;
    const boxW = rW - sideMargin * 2;
    const padX = 36;
    const innerW = boxW - padX * 2;
    const textLeft = boxX + padX;

    // Helpers
    const wrap = (text: string, maxW: number, font: string): string[] => {
      ctx.font = font;
      const words = text.split(' ');
      const lines: string[] = [];
      let cur = words[0] || '';
      for (let i = 1; i < words.length; i++) {
        const test = cur + ' ' + words[i];
        if (ctx.measureText(test).width < maxW) cur = test;
        else { lines.push(cur); cur = words[i]; }
      }
      lines.push(cur);
      return lines;
    };

    const rr = (x: number, y: number, w: number, h: number, r: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    };

    // ── Load logo ──
    const logoImg = new Image();
    logoImg.src = logoNT;
    await new Promise(r => { logoImg.onload = r; logoImg.onerror = r; });

    // ── Pre-calculate heights ──

    // Logo
    const logoH = 80;
    const logoAspect = logoImg.width / logoImg.height;
    const logoW = logoH * logoAspect;
    const logoToBox = 24;

    // Main box
    const titleLine1 = data.tipoMutirao === 'Entrevistas' ? 'Mutirão de'
      : data.tipoMutirao === 'Curriculos' ? 'Entrega de'
      : (data.mensagemExtra || 'Mutirão');
    const titleLine2 = data.tipoMutirao === 'Entrevistas' ? 'Entrevistas'
      : data.tipoMutirao === 'Curriculos' ? 'Currículos'
      : data.tipoMutirao === 'Personalizado' ? '' : data.tipoMutirao;

    const cargoText = `Vaga: ${data.cargo || 'Cargo'}`;
    const cargoFont = 'bold 42px Montserrat, Arial';
    const cargoLines = wrap(cargoText, innerW, cargoFont);

    const parseDetails = () => {
      if (!data.detalhes) return [];
      const lines = data.detalhes.split('\n');
      const blocks: { text: string; bold: boolean }[] = [];
      lines.forEach(line => {
        if (line.trim()) {
          const isBold = /^(Turno|Segunda|Benefícios|Horário|Disponibilidade)/i.test(line.trim());
          blocks.push({ text: line.trim(), bold: isBold });
        } else {
          blocks.push({ text: '', bold: false });
        }
      });
      return blocks;
    };
    const detailBlocks = parseDetails();

    let mainH = 44;
    mainH += 60;
    if (titleLine2) mainH += 66;
    mainH += 8;
    mainH += cargoLines.length * 50;
    if (data.tipoContrato) { mainH += 20; mainH += 32; }
    if (detailBlocks.length > 0) {
      mainH += 16;
      detailBlocks.forEach(block => {
        if (block.text === '') {
          mainH += 16;
        } else {
          const font = block.bold ? 'bold 28px Montserrat, Arial' : '26px Montserrat, Arial';
          const wrapped = wrap(block.text, innerW, font);
          mainH += wrapped.length * (block.bold ? 38 : 34);
        }
      });
    }
    mainH += 44;

    // Action section
    const actionGap = 16;
    let actionH = 0;
    const actionBoldFont = 'bold 24px Montserrat, Arial';
    const actionRegFont = '24px Montserrat, Arial';

    const actionBlocks: { boldText: string; regularText: string; color: string }[] = [];

    if (data.dataPrazo || data.localEntrega) {
      const instrText = data.tipoMutirao === 'Curriculos'
        ? (data.dataPrazo ? `Entregue seu currículo ${data.dataPrazo} no endereço abaixo.` : 'Entregue seu currículo no endereço abaixo.')
        : (data.dataPrazo ? `Compareça com o currículo em mãos ${data.dataPrazo} no endereço abaixo.` : 'Compareça com o currículo em mãos no endereço abaixo.');
      actionBlocks.push({ boldText: instrText, regularText: '', color: PRIMARY });
    }

    if (data.localEntrega) {
      actionBlocks.push({ boldText: 'Local de Entrega:', regularText: data.localEntrega, color: PRIMARY });
    }

    if (data.mensagemExtra && data.tipoMutirao !== 'Personalizado') {
      actionBlocks.push({ boldText: '', regularText: data.mensagemExtra, color: '#333333' });
    }

    actionBlocks.forEach((block, i) => {
      const bLines = block.boldText ? wrap(block.boldText, innerW, actionBoldFont) : [];
      const rLines = block.regularText ? wrap(block.regularText, innerW, actionRegFont) : [];
      const blockH = (bLines.length + rLines.length) * 34 + 48;
      actionH += blockH;
      if (i < actionBlocks.length - 1) actionH += actionGap;
    });

    const showContact = data.contato.tipo !== 'site' && data.contato.valor;
    const contactH = showContact ? 100 : 0;
    if (showContact) actionH += (actionBlocks.length > 0 ? actionGap : 0) + contactH;

    // ── Vertical centering ──
    const totalH = logoH + logoToBox + mainH + (actionH > 0 ? actionGap + actionH : 0);
    const startY = Math.max(28, (H - totalH) / 2);

    // ══════════════════════════
    // ── DRAW ──
    // ══════════════════════════

    let y = startY;

    // ── Logo (only Novo Tempo) ──
    ctx.drawImage(logoImg, textLeft, y, logoW, logoH);
    y += logoH + logoToBox;

    // ── Main green box ──
    const mainBoxY = y;
    rr(boxX, mainBoxY, boxW, mainH, 22, PRIMARY);

    let ty = mainBoxY + 44;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 56px Montserrat, Arial';
    ctx.textAlign = 'left';
    ctx.fillText(titleLine1, textLeft, ty + 44);
    ty += 60;
    if (titleLine2) {
      ctx.fillText(titleLine2, textLeft, ty + 50);
      ty += 66;
    }
    ty += 8;
    ctx.font = cargoFont;
    cargoLines.forEach(line => {
      ctx.fillText(line, textLeft, ty + 34);
      ty += 50;
    });
    if (data.tipoContrato) {
      ty += 20;
      ctx.font = '26px Montserrat, Arial';
      ctx.fillText(`Tipo de Contrato: ${data.tipoContrato}`, textLeft, ty + 20);
      ty += 32;
    }
    if (detailBlocks.length > 0) {
      ty += 16;
      detailBlocks.forEach(block => {
        if (block.text === '') { ty += 16; }
        else {
          const font = block.bold ? 'bold 28px Montserrat, Arial' : '26px Montserrat, Arial';
          ctx.font = font;
          const wrapped = wrap(block.text, innerW, font);
          wrapped.forEach(wl => {
            ctx.fillText(wl, textLeft, ty + (block.bold ? 26 : 22));
            ty += block.bold ? 38 : 34;
          });
        }
      });
    }

    y = mainBoxY + mainH + actionGap;

    // ── Action blocks ──
    actionBlocks.forEach((block) => {
      const bLines = block.boldText ? wrap(block.boldText, innerW, actionBoldFont) : [];
      const rLines = block.regularText ? wrap(block.regularText, innerW, actionRegFont) : [];
      const totalLines = bLines.length + rLines.length;
      const vertPad = 24;
      const lineH = 34;
      const blockH = totalLines * lineH + vertPad * 2;
      rr(boxX, y, boxW, blockH, 18, block.color);
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      let ly = y + vertPad + 20;
      bLines.forEach(line => {
        ctx.font = actionBoldFont;
        ctx.fillText(line, textLeft, ly);
        ly += lineH;
      });
      rLines.forEach(line => {
        ctx.font = actionRegFont;
        ctx.fillText(line, textLeft, ly);
        ly += lineH;
      });
      y += blockH + actionGap;
    });

    // ── Contact ──
    if (showContact) {
      rr(boxX, y, boxW, contactH, 18, PRIMARY);
      const contactText = data.contato.tipo === 'whatsapp'
        ? data.contato.valor || '(xx) xxxxx-xxxx'
        : data.contato.valor || 'email@exemplo.com';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Envie seu currículo em:', boxX + boxW / 2, y + 36);
      ctx.font = 'bold 26px Montserrat, Arial';
      const btnTextW = ctx.measureText(contactText).width;
      const btnW = btnTextW + 72;
      const btnX = boxX + (boxW - btnW) / 2;
      const btnY = y + 52;
      rr(btnX, btnY, btnW, 38, 19, '#FFFFFF');
      if (data.contato.tipo === 'whatsapp') {
        const waImg = new Image();
        waImg.src = whatsappIcon;
        await new Promise(r => { waImg.onload = r; waImg.onerror = r; });
        ctx.drawImage(waImg, btnX + 14, btnY + 7, 24, 24);
        ctx.fillStyle = '#11332B';
        ctx.textAlign = 'left';
        ctx.fillText(contactText, btnX + 44, btnY + 27);
      } else {
        ctx.fillStyle = '#11332B';
        ctx.textAlign = 'center';
        ctx.fillText(`✉️ ${contactText}`, boxX + boxW / 2, btnY + 27);
      }
      ctx.textAlign = 'left';
    }
  };

  useEffect(() => {
    drawCartaz();
  }, [data]);

  return (
    <div className="cartaz-container bg-white shadow-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        id="cartaz-canvas-tradicional"
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};
