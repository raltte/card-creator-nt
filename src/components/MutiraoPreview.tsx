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
    const baseWidth = 1080;
    const baseHeight = 1350;
    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, baseWidth, baseHeight);

    // Background white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    const leftWidth = Math.round(baseWidth * 0.45); // ~486px

    // ─── Left side: image ───
    if (data.image && data.image !== '') {
      const leftImage = new Image();
      leftImage.crossOrigin = 'anonymous';
      leftImage.src = typeof data.image === 'string' ? data.image : URL.createObjectURL(data.image as File);
      await new Promise((resolve) => { leftImage.onload = resolve; leftImage.onerror = resolve; });

      const imageAspect = leftImage.width / leftImage.height;
      const canvasAspect = leftWidth / baseHeight;
      let dw, dh, dx, dy;
      if (imageAspect > canvasAspect) {
        dh = baseHeight; dw = baseHeight * imageAspect;
        dx = -(dw - leftWidth) / 2; dy = 0;
      } else {
        dw = leftWidth; dh = leftWidth / imageAspect;
        dx = 0; dy = -(dh - baseHeight) / 2;
      }
      ctx.drawImage(leftImage, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, leftWidth, baseHeight);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '32px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Imagem', leftWidth / 2, baseHeight / 2);
      ctx.textAlign = 'left';
    }

    // ─── Right side config ───
    const rightX = leftWidth;
    const rightWidth = baseWidth - leftWidth; // ~594px
    const margin = 36;
    const contentX = rightX + margin;
    const maxTextWidth = rightWidth - margin * 2;

    // Helper: wrap text
    const wrapText = (text: string, maxW: number, font: string): string[] => {
      ctx.font = font;
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = words[0] || '';
      for (let i = 1; i < words.length; i++) {
        const test = currentLine + ' ' + words[i];
        if (ctx.measureText(test).width < maxW) {
          currentLine = test;
        } else {
          lines.push(currentLine);
          currentLine = words[i];
        }
      }
      lines.push(currentLine);
      return lines;
    };

    // Helper: draw rounded rect
    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    };

    // ─── Logos: Bombril & NT side by side ───
    const logoNT = new Image();
    logoNT.src = logoNTIcon;
    const logoBomb = new Image();
    logoBomb.src = logoBombril;
    await Promise.all([
      new Promise((resolve) => { logoNT.onload = resolve; logoNT.onerror = resolve; }),
      new Promise((resolve) => { logoBomb.onload = resolve; logoBomb.onerror = resolve; })
    ]);

    const logoH = 100;
    const ntW = logoH; // square
    const bombAspect = logoBomb.width / logoBomb.height;
    const bombW = logoH * bombAspect;
    const ampersandW = 36;
    const totalLogosW = bombW + ampersandW + ntW;
    const logosX = contentX + (maxTextWidth - totalLogosW) / 2;
    const logoY = 36;

    ctx.drawImage(logoBomb, logosX, logoY, bombW, logoH);

    // "&" between logos
    ctx.fillStyle = '#E53935';
    ctx.font = 'bold 36px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('&', logosX + bombW + ampersandW / 2, logoY + logoH / 2 + 12);
    ctx.textAlign = 'left';

    ctx.drawImage(logoNT, logosX + bombW + ampersandW, logoY, ntW, logoH);

    // ─── Red content box ───
    const boxMargin = 24;
    const boxX = rightX + boxMargin;
    const boxW = rightWidth - boxMargin * 2;
    const boxPadX = 32;
    const boxInnerW = boxW - boxPadX * 2;

    // Pre-calculate all content height
    const titleLine1 = data.tipoMutirao === 'Entrevistas' ? 'Mutirão de'
      : data.tipoMutirao === 'Curriculos' ? 'Entrega de'
      : data.tipoMutirao === 'Personalizado' ? (data.mensagemExtra || 'Mutirão') : 'Mutirão de';
    const titleLine2 = data.tipoMutirao === 'Entrevistas' ? 'Entrevistas'
      : data.tipoMutirao === 'Curriculos' ? 'Currículos'
      : data.tipoMutirao === 'Personalizado' ? '' : data.tipoMutirao;

    const cargoText = `Vaga: ${data.cargo || 'Cargo'}`;
    const cargoFont = 'bold 42px Montserrat, Arial';
    const cargoLines = wrapText(cargoText, boxInnerW, cargoFont);

    let contentH = 0;
    contentH += 62; // title line 1
    if (titleLine2) contentH += 62; // title line 2
    contentH += 16; // gap
    contentH += cargoLines.length * 50; // cargo
    if (data.tipoContrato) { contentH += 16; contentH += 36; } // contract type
    if (data.detalhes) {
      contentH += 20;
      const detLines = data.detalhes.split('\n');
      detLines.forEach(line => {
        if (line.trim()) {
          const isBold = /^(Turno|Segunda|Benefícios|Horário|Disponibilidade)/i.test(line.trim());
          const font = isBold ? 'bold 26px Montserrat, Arial' : '26px Montserrat, Arial';
          const wrapped = wrapText(line.trim(), boxInnerW, font);
          contentH += wrapped.length * 34;
        } else {
          contentH += 12;
        }
      });
    }
    contentH += 40; // padding top + bottom

    const boxY = logoY + logoH + 24;
    const boxH = contentH + 48;

    drawRoundedRect(boxX, boxY, boxW, boxH, 22, '#E53935');

    // ─── Draw content inside red box ───
    let y = boxY + 40;
    const textCenterX = boxX + boxW / 2;

    // Title - centered
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 54px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(titleLine1, textCenterX, y);
    y += 62;
    if (titleLine2) {
      ctx.fillText(titleLine2, textCenterX, y);
      y += 62;
    }

    // Cargo - centered
    y += 8;
    ctx.font = cargoFont;
    cargoLines.forEach(line => {
      ctx.fillText(line, textCenterX, y);
      y += 50;
    });

    // Contract type - left aligned inside box
    if (data.tipoContrato) {
      y += 8;
      ctx.font = '28px Montserrat, Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Tipo de Contrato: ${data.tipoContrato}`, boxX + boxPadX, y);
      y += 36;
    }

    // Details - left aligned
    if (data.detalhes) {
      y += 12;
      ctx.textAlign = 'left';
      const detLines = data.detalhes.split('\n');
      detLines.forEach(line => {
        if (line.trim()) {
          const isBold = /^(Turno|Segunda|Benefícios|Horário|Disponibilidade)/i.test(line.trim());
          const font = isBold ? 'bold 26px Montserrat, Arial' : '26px Montserrat, Arial';
          ctx.font = font;
          const wrapped = wrapText(line.trim(), boxInnerW, font);
          wrapped.forEach(wl => {
            ctx.fillText(wl, boxX + boxPadX, y);
            y += 34;
          });
        } else {
          y += 12;
        }
      });
    }

    // ─── Action section below red box ───
    let actionY = boxY + boxH + 18;
    const actionBoxX = boxX;
    const actionBoxW = boxW;

    // Date/instruction red box
    if (data.dataPrazo || data.localEntrega) {
      let actionText = '';
      if (data.tipoMutirao === 'Curriculos') {
        actionText = data.dataPrazo
          ? `Entregue seu currículo ${data.dataPrazo} no endereço abaixo.`
          : 'Entregue seu currículo no endereço abaixo.';
      } else {
        actionText = data.dataPrazo
          ? `Compareça com o currículo em mãos ${data.dataPrazo} no endereço abaixo.`
          : 'Compareça com o currículo em mãos no endereço abaixo.';
      }

      ctx.font = 'bold 24px Montserrat, Arial';
      const actionLines = wrapText(actionText, actionBoxW - 48, 'bold 24px Montserrat, Arial');
      const actionH = actionLines.length * 32 + 32;

      drawRoundedRect(actionBoxX, actionY, actionBoxW, actionH, 18, '#E53935');

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Montserrat, Arial';
      ctx.textAlign = 'center';
      let atY = actionY + 30;
      actionLines.forEach(line => {
        ctx.fillText(line, actionBoxX + actionBoxW / 2, atY);
        atY += 32;
      });

      actionY += actionH + 10;

      // Address white rounded box
      if (data.localEntrega) {
        ctx.font = 'bold 22px Montserrat, Arial';
        const addrLines = wrapText(data.localEntrega, actionBoxW - 72, 'bold 22px Montserrat, Arial');
        const addrH = addrLines.length * 30 + 32;

        drawRoundedRect(actionBoxX + 12, actionY, actionBoxW - 24, addrH, 14, '#FFFFFF');

        // Border
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(actionBoxX + 12, actionY, actionBoxW - 24, addrH, 14);
        ctx.stroke();

        ctx.fillStyle = '#333333';
        ctx.font = 'bold 22px Montserrat, Arial';
        ctx.textAlign = 'center';
        let addrY = actionY + 26;
        addrLines.forEach(line => {
          ctx.fillText(line, actionBoxX + actionBoxW / 2, addrY);
          addrY += 30;
        });

        actionY += addrH + 14;
      }
    }

    // Extra message box (red)
    if (data.tipoMutirao !== 'Personalizado' && data.mensagemExtra) {
      ctx.font = 'bold 22px Montserrat, Arial';
      const msgLines = wrapText(data.mensagemExtra, actionBoxW - 72, 'bold 22px Montserrat, Arial');
      const msgH = msgLines.length * 30 + 32;

      drawRoundedRect(actionBoxX + 12, actionY, actionBoxW - 24, msgH, 14, '#E53935');

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Montserrat, Arial';
      ctx.textAlign = 'center';
      let msgY = actionY + 26;
      msgLines.forEach(line => {
        ctx.fillText(line, actionBoxX + actionBoxW / 2, msgY);
        msgY += 30;
      });

      actionY += msgH + 14;
    }

    // Contact footer
    if (data.contato.tipo && actionY + 90 < baseHeight - 18) {
      const footerH = 90;
      drawRoundedRect(actionBoxX, actionY, actionBoxW, footerH, 18, '#20CE90');

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Envie seu currículo em:', actionBoxX + actionBoxW / 2, actionY + 30);

      const contactText = data.contato.tipo === 'whatsapp'
        ? data.contato.valor || '(xx) xxxxx-xxxx'
        : data.contato.tipo === 'email'
        ? data.contato.valor || 'email@exemplo.com'
        : 'novotemporh.com.br';

      const btnY = actionY + 46;
      ctx.font = 'bold 22px Montserrat, Arial';
      const btnTextW = ctx.measureText(contactText).width;
      const btnW = btnTextW + 60;
      const btnX = actionBoxX + (actionBoxW - btnW) / 2;

      drawRoundedRect(btnX, btnY, btnW, 34, 17, '#FFFFFF');

      if (data.contato.tipo === 'whatsapp') {
        const whatsappImg = new Image();
        whatsappImg.src = whatsappIcon;
        await new Promise((resolve) => { whatsappImg.onload = resolve; whatsappImg.onerror = resolve; });
        ctx.drawImage(whatsappImg, btnX + 12, btnY + 5, 24, 24);
        ctx.fillStyle = '#11332B';
        ctx.font = 'bold 22px Montserrat, Arial';
        ctx.textAlign = 'left';
        ctx.fillText(contactText, btnX + 40, btnY + 24);
      } else {
        const icon = data.contato.tipo === 'email' ? '✉️' : '🌐';
        ctx.fillStyle = '#11332B';
        ctx.font = 'bold 22px Montserrat, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${icon} ${contactText}`, actionBoxX + actionBoxW / 2, btnY + 24);
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
