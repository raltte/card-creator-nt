import { useEffect, useRef } from "react";
import { MutiraoData } from "./MutiraoForm";
import logoNTIcon from "@/assets/logo-nt-icon.png";
import logoBombril from "@/assets/logo-bombril.png";
import whatsappIcon from "@/assets/whatsapp.svg";

interface MutiraoPreviewProps {
  data: MutiraoData;
}

export const MutiraoPreview = ({ data }: MutiraoPreviewProps) => {
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

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    const leftW = Math.round(W * 0.45);

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

    // ── Right side constants ──
    const rX = leftW;
    const rW = W - leftW;
    const margin = 32;
    const boxX = rX + margin;
    const boxW = rW - margin * 2;
    const padX = 36;
    const innerW = boxW - padX * 2;

    // Helper: wrap text
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

    // ── Load logos ──
    const logoNT = new Image();
    logoNT.src = logoNTIcon;
    const logoBomb = new Image();
    logoBomb.src = logoBombril;
    await Promise.all([
      new Promise(r => { logoNT.onload = r; logoNT.onerror = r; }),
      new Promise(r => { logoBomb.onload = r; logoBomb.onerror = r; })
    ]);

    // ── Pre-calculate total content height for vertical centering ──

    // 1) Logo section
    const logoH = 90;
    const bombAspect = logoBomb.width / logoBomb.height;
    const bombW = logoH * bombAspect;
    const ntW2 = logoH;
    const ampW = 32;
    const logoSectionH = logoH;
    const logoGap = 20; // gap between logos and red box

    // 2) Red box content height
    const titleLine1 = data.tipoMutirao === 'Entrevistas' ? 'Mutirão de'
      : data.tipoMutirao === 'Curriculos' ? 'Entrega de'
      : (data.mensagemExtra || 'Mutirão');
    const titleLine2 = data.tipoMutirao === 'Entrevistas' ? 'Entrevistas'
      : data.tipoMutirao === 'Curriculos' ? 'Currículos'
      : data.tipoMutirao === 'Personalizado' ? '' : data.tipoMutirao;

    const cargoText = `Vaga: ${data.cargo || 'Cargo'}`;
    const cargoFont = 'bold 44px Montserrat, Arial';
    const cargoLines = wrap(cargoText, innerW, cargoFont);

    let redContentH = 36; // top padding
    redContentH += 58; // title line 1
    if (titleLine2) redContentH += 62;
    redContentH += 12;
    redContentH += cargoLines.length * 52;
    if (data.tipoContrato) { redContentH += 14; redContentH += 34; }
    if (data.detalhes) {
      redContentH += 18;
      data.detalhes.split('\n').forEach(line => {
        if (line.trim()) {
          const isBold = /^(Turno|Segunda|Benefícios|Horário|Disponibilidade)/i.test(line.trim());
          const font = isBold ? 'bold 26px Montserrat, Arial' : '26px Montserrat, Arial';
          redContentH += wrap(line.trim(), innerW, font).length * 34;
        } else {
          redContentH += 14;
        }
      });
    }
    redContentH += 36; // bottom padding
    const redBoxH = redContentH;

    // 3) Action section height
    let actionSectionH = 0;
    const actionGap = 12;

    let actionText = '';
    let actionLines: string[] = [];
    let actionBoxH = 0;
    if (data.dataPrazo || data.localEntrega) {
      if (data.tipoMutirao === 'Curriculos') {
        actionText = data.dataPrazo
          ? `Entregue seu currículo ${data.dataPrazo} no endereço abaixo.`
          : 'Entregue seu currículo no endereço abaixo.';
      } else {
        actionText = data.dataPrazo
          ? `Compareça com o currículo em mãos ${data.dataPrazo} no endereço abaixo.`
          : 'Compareça com o currículo em mãos no endereço abaixo.';
      }
      actionLines = wrap(actionText, boxW - 48, 'bold 26px Montserrat, Arial');
      actionBoxH = actionLines.length * 34 + 32;
      actionSectionH += actionBoxH + actionGap;
    }

    let addrLines: string[] = [];
    let addrBoxH = 0;
    if (data.localEntrega) {
      addrLines = wrap(data.localEntrega, boxW - 72, 'bold 22px Montserrat, Arial');
      addrBoxH = addrLines.length * 30 + 32;
      actionSectionH += addrBoxH + actionGap;
    }

    let msgLines: string[] = [];
    let msgBoxH = 0;
    if (data.tipoMutirao !== 'Personalizado' && data.mensagemExtra) {
      msgLines = wrap(data.mensagemExtra, boxW - 72, 'bold 22px Montserrat, Arial');
      msgBoxH = msgLines.length * 30 + 32;
      actionSectionH += msgBoxH + actionGap;
    }

    // 4) Contact footer
    const hasContact = !!data.contato.tipo;
    const contactH = hasContact ? 100 : 0;
    if (hasContact) actionSectionH += contactH;

    // ── Total height & vertical offset ──
    const totalH = logoSectionH + logoGap + redBoxH + (actionSectionH > 0 ? actionGap + actionSectionH : 0);
    const startY = Math.max(24, (H - totalH) / 2);

    // ══════════════════════════════════════
    // ── DRAW ──
    // ══════════════════════════════════════

    let y = startY;

    // ── Logos ──
    const totalLogosW = bombW + ampW + ntW2;
    const logosStartX = boxX + (boxW - totalLogosW) / 2;
    ctx.drawImage(logoBomb, logosStartX, y, bombW, logoH);
    ctx.fillStyle = '#E53935';
    ctx.font = 'bold 32px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('&', logosStartX + bombW + ampW / 2, y + logoH / 2 + 10);
    ctx.textAlign = 'left';
    ctx.drawImage(logoNT, logosStartX + bombW + ampW, y, ntW2, logoH);
    y += logoSectionH + logoGap;

    // ── Red box ──
    const redBoxY = y;
    rr(boxX, redBoxY, boxW, redBoxH, 22, '#E53935');

    let ty = redBoxY + 36;
    const textLeft = boxX + padX;

    // Title - LEFT aligned
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 54px Montserrat, Arial';
    ctx.textAlign = 'left';
    ctx.fillText(titleLine1, textLeft, ty + 46);
    ty += 58;
    if (titleLine2) {
      ctx.fillText(titleLine2, textLeft, ty + 46);
      ty += 62;
    }

    // Cargo - LEFT aligned
    ty += 12;
    ctx.font = cargoFont;
    cargoLines.forEach(line => {
      ctx.fillText(line, textLeft, ty + 38);
      ty += 52;
    });

    // Contract type
    if (data.tipoContrato) {
      ty += 14;
      ctx.font = '28px Montserrat, Arial';
      ctx.fillText(`Tipo de Contrato: ${data.tipoContrato}`, textLeft, ty + 22);
      ty += 34;
    }

    // Details - LEFT aligned
    if (data.detalhes) {
      ty += 18;
      data.detalhes.split('\n').forEach(line => {
        if (line.trim()) {
          const isBold = /^(Turno|Segunda|Benefícios|Horário|Disponibilidade)/i.test(line.trim());
          const font = isBold ? 'bold 26px Montserrat, Arial' : '26px Montserrat, Arial';
          ctx.font = font;
          wrap(line.trim(), innerW, font).forEach(wl => {
            ctx.fillText(wl, textLeft, ty + 22);
            ty += 34;
          });
        } else {
          ty += 14;
        }
      });
    }

    y = redBoxY + redBoxH + actionGap;

    // ── Action instruction box (red) ──
    if (actionLines.length > 0) {
      rr(boxX, y, boxW, actionBoxH, 18, '#E53935');
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px Montserrat, Arial';
      ctx.textAlign = 'center';
      let atY = y + 26;
      actionLines.forEach(line => {
        ctx.fillText(line, boxX + boxW / 2, atY);
        atY += 34;
      });
      y += actionBoxH + actionGap;
    }

    // ── Address box (white) ──
    if (addrLines.length > 0) {
      rr(boxX + 12, y, boxW - 24, addrBoxH, 14, '#FFFFFF');
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(boxX + 12, y, boxW - 24, addrBoxH, 14);
      ctx.stroke();
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 22px Montserrat, Arial';
      ctx.textAlign = 'center';
      let addrY = y + 26;
      addrLines.forEach(line => {
        ctx.fillText(line, boxX + boxW / 2, addrY);
        addrY += 30;
      });
      y += addrBoxH + actionGap;
    }

    // ── Extra message box (red) ──
    if (msgLines.length > 0) {
      rr(boxX + 12, y, boxW - 24, msgBoxH, 14, '#E53935');
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Montserrat, Arial';
      ctx.textAlign = 'center';
      let msgY = y + 26;
      msgLines.forEach(line => {
        ctx.fillText(line, boxX + boxW / 2, msgY);
        msgY += 30;
      });
      y += msgBoxH + actionGap;
    }

    // ── Contact footer (green, larger) ──
    if (hasContact) {
      rr(boxX, y, boxW, contactH, 18, '#20CE90');

      const contactText = data.contato.tipo === 'whatsapp'
        ? data.contato.valor || '(xx) xxxxx-xxxx'
        : data.contato.tipo === 'email'
        ? data.contato.valor || 'email@exemplo.com'
        : 'novotemporh.com.br';

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Envie seu currículo em:', boxX + boxW / 2, y + 36);

      // Contact button
      ctx.font = 'bold 26px Montserrat, Arial';
      const btnTextW = ctx.measureText(contactText).width;
      const btnW = btnTextW + 72;
      const btnX = boxX + (boxW - btnW) / 2;
      const btnY = y + 52;
      const btnH = 38;

      rr(btnX, btnY, btnW, btnH, 19, '#FFFFFF');

      if (data.contato.tipo === 'whatsapp') {
        const waImg = new Image();
        waImg.src = whatsappIcon;
        await new Promise(r => { waImg.onload = r; waImg.onerror = r; });
        ctx.drawImage(waImg, btnX + 14, btnY + 7, 24, 24);
        ctx.fillStyle = '#11332B';
        ctx.textAlign = 'left';
        ctx.fillText(contactText, btnX + 44, btnY + 27);
      } else {
        const icon = data.contato.tipo === 'email' ? '✉️' : '🌐';
        ctx.fillStyle = '#11332B';
        ctx.textAlign = 'center';
        ctx.fillText(`${icon} ${contactText}`, boxX + boxW / 2, btnY + 27);
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
        id="cartaz-canvas"
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};
