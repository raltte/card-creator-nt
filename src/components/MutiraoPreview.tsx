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

    const leftWidth = Math.round(baseWidth * 0.45);

    // Left side - image
    let leftImage: HTMLImageElement;
    if (data.image && data.image !== '') {
      leftImage = new Image();
      leftImage.crossOrigin = 'anonymous';
      leftImage.src = typeof data.image === 'string' ? data.image : URL.createObjectURL(data.image as File);
      await new Promise((resolve) => { leftImage.onload = resolve; leftImage.onerror = resolve; });
    } else {
      leftImage = new Image();
      leftImage.src = 'data:image/svg+xml;base64,' + btoa(`<svg width="${leftWidth}" height="${baseHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="${leftWidth}" height="${baseHeight}" fill="#f3f4f6"/><text x="${leftWidth/2}" y="${baseHeight/2}" text-anchor="middle" font-family="Arial" font-size="32" fill="#9ca3af">Imagem</text></svg>`);
      await new Promise((resolve) => { leftImage.onload = resolve; });
    }

    // Draw left image with cover
    const imageAspect = leftImage.width / leftImage.height;
    const canvasAspect = leftWidth / baseHeight;
    let drawWidth, drawHeight, offsetX, offsetY;
    if (imageAspect > canvasAspect) {
      drawHeight = baseHeight;
      drawWidth = baseHeight * imageAspect;
      offsetX = -(drawWidth - leftWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = leftWidth;
      drawHeight = leftWidth / imageAspect;
      offsetX = 0;
      offsetY = -(drawHeight - baseHeight) / 2;
    }
    ctx.drawImage(leftImage, offsetX, offsetY, drawWidth, drawHeight);

    // Right side config
    const rightX = leftWidth;
    const rightWidth = baseWidth - leftWidth;
    const contentX = rightX + 36;
    const maxTextWidth = rightWidth - 72;

    // Logos at top right - NT icon and Bombril side by side
    const logoNT = new Image();
    logoNT.src = logoNTIcon;
    const logoBomb = new Image();
    logoBomb.src = logoBombril;
    await Promise.all([
      new Promise((resolve) => { logoNT.onload = resolve; logoNT.onerror = resolve; }),
      new Promise((resolve) => { logoBomb.onload = resolve; logoBomb.onerror = resolve; })
    ]);
    
    const logoSize = 120;
    const logoGap = 24;
    const totalLogosWidth = logoSize * 2 + logoGap;
    const logosStartX = contentX + (maxTextWidth - totalLogosWidth) / 2;
    const logoY = 36;
    
    // Draw NT icon
    ctx.drawImage(logoNT, logosStartX, logoY, logoSize, logoSize);
    // Draw Bombril logo
    const bombrilAspect = logoBomb.width / logoBomb.height;
    const bombrilW = logoSize * bombrilAspect;
    const bombrilH = logoSize;
    ctx.drawImage(logoBomb, logosStartX + logoSize + logoGap, logoY + (logoSize - bombrilH) / 2, bombrilW, bombrilH);

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

    // Red rounded box
    const boxX = contentX - 12;
    const boxY = 45 + logoHeight + 36;
    const boxWidth = maxTextWidth + 24;

    // Build title
    const titleLine1 = data.tipoMutirao === 'Entrevistas' ? 'Mutirão de'
      : data.tipoMutirao === 'Curriculos' ? 'Entrega de'
      : data.tipoMutirao === 'Personalizado' ? (data.mensagemExtra || 'Mutirão') : 'Mutirão de';
    const titleLine2 = data.tipoMutirao === 'Entrevistas' ? 'Entrevistas'
      : data.tipoMutirao === 'Curriculos' ? 'Currículos'
      : data.tipoMutirao === 'Personalizado' ? '' : data.tipoMutirao;

    // Calculate red box content height dynamically
    let tempY = 0;
    // Title
    tempY += 72 + (titleLine2 ? 67 : 0); // title lines
    tempY += 18;
    // Cargo
    const cargoText = `Vaga: ${data.cargo || 'Cargo'}`;
    ctx.font = 'bold 40px Montserrat, Arial';
    const cargoLines = wrapText(cargoText, boxWidth - 72, 'bold 40px Montserrat, Arial');
    tempY += cargoLines.length * 50 + 18;
    // Tipo contrato
    if (data.tipoContrato) tempY += 40;
    tempY += 18;
    // Detalhes
    if (data.detalhes) {
      const detLines = data.detalhes.split('\n');
      detLines.forEach(line => {
        if (line.trim()) {
          const wrapped = wrapText(line.trim(), boxWidth - 72, '26px Montserrat, Arial');
          tempY += wrapped.length * 34;
        }
        tempY += 8;
      });
    }
    tempY += 36; // padding bottom

    const boxHeight = Math.max(tempY + 72, 400);

    // Draw red box
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 24);
    ctx.fill();

    // Content inside red box
    let y = boxY + 54;
    const textX = boxX + 36;
    const innerMaxW = boxWidth - 72;

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 58px Montserrat, Arial';
    ctx.textAlign = 'left';
    ctx.fillText(titleLine1, textX, y);
    y += 67;
    if (titleLine2) {
      ctx.fillText(titleLine2, textX, y);
      y += 67;
    }

    // Cargo
    y += 9;
    ctx.font = 'bold 40px Montserrat, Arial';
    cargoLines.forEach(line => {
      ctx.fillText(line, textX, y);
      y += 50;
    });

    // Tipo contrato
    if (data.tipoContrato) {
      y += 9;
      ctx.font = '28px Montserrat, Arial';
      ctx.fillText(`Tipo de Contrato: ${data.tipoContrato}`, textX, y);
      y += 40;
    }

    // Detalhes
    if (data.detalhes) {
      y += 18;
      const detLines = data.detalhes.split('\n');
      detLines.forEach(line => {
        if (line.trim()) {
          // Check if it looks like a header (bold)
          const isBold = /^(Turno|Segunda|Benefícios|Horário|Disponibilidade)/i.test(line.trim());
          const font = isBold ? 'bold 26px Montserrat, Arial' : '26px Montserrat, Arial';
          ctx.font = font;
          const wrapped = wrapText(line.trim(), innerMaxW, font);
          wrapped.forEach(wl => {
            ctx.fillText(wl, textX, y);
            y += 34;
          });
        } else {
          y += 8;
        }
      });
    }

    // Below red box - action section
    let actionY = boxY + boxHeight + 27;

    // Date/address green box
    if (data.dataPrazo || data.localEntrega) {
      const actionBoxX = boxX;
      const actionBoxWidth = boxWidth;

      // Build action text
      let actionTitle = '';
      if (data.tipoMutirao === 'Curriculos') {
        actionTitle = data.dataPrazo
          ? `Entregue seu currículo ${data.dataPrazo} no endereço abaixo.`
          : 'Entregue seu currículo no endereço abaixo.';
      } else {
        actionTitle = data.dataPrazo
          ? `Compareça com o currículo em mãos ${data.dataPrazo} no endereço abaixo.`
          : 'Compareça com o currículo em mãos no endereço abaixo.';
      }

      // Title in green/red box
      ctx.font = 'bold 24px Montserrat, Arial';
      const actionTitleLines = wrapText(actionTitle, actionBoxWidth - 54, 'bold 24px Montserrat, Arial');
      const actionTitleH = actionTitleLines.length * 32 + 36;

      ctx.fillStyle = '#20CE90';
      ctx.beginPath();
      ctx.roundRect(actionBoxX, actionY, actionBoxWidth, actionTitleH, 18);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Montserrat, Arial';
      ctx.textAlign = 'center';
      let atY = actionY + 32;
      actionTitleLines.forEach(line => {
        ctx.fillText(line, actionBoxX + actionBoxWidth / 2, atY);
        atY += 32;
      });
      ctx.textAlign = 'left';

      actionY += actionTitleH + 9;

      // Address white box
      if (data.localEntrega) {
        ctx.font = '22px Montserrat, Arial';
        const addrLines = wrapText(data.localEntrega, actionBoxWidth - 54, '22px Montserrat, Arial');
        const addrH = addrLines.length * 30 + 36;

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(actionBoxX + 18, actionY, actionBoxWidth - 36, addrH, 14);
        ctx.fill();

        ctx.fillStyle = '#333333';
        ctx.font = '22px Montserrat, Arial';
        ctx.textAlign = 'center';
        let addrY = actionY + 28;
        addrLines.forEach(line => {
          ctx.fillText(line, actionBoxX + actionBoxWidth / 2, addrY);
          addrY += 30;
        });
        ctx.textAlign = 'left';

        actionY += addrH + 18;
      }
    }

    // Extra message box (red)
    if (data.tipoMutirao !== 'Personalizado' && data.mensagemExtra) {
      const msgBoxX = boxX;
      const msgBoxWidth = boxWidth;
      ctx.font = '22px Montserrat, Arial';
      const msgLines = wrapText(data.mensagemExtra, msgBoxWidth - 54, '22px Montserrat, Arial');
      const msgH = msgLines.length * 30 + 36;

      ctx.fillStyle = '#E53935';
      ctx.beginPath();
      ctx.roundRect(msgBoxX + 18, actionY, msgBoxWidth - 36, msgH, 14);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '22px Montserrat, Arial';
      ctx.textAlign = 'center';
      let msgY = actionY + 28;
      msgLines.forEach(line => {
        ctx.fillText(line, msgBoxX + msgBoxWidth / 2, msgY);
        msgY += 30;
      });
      ctx.textAlign = 'left';
      actionY += msgH + 18;
    }

    // Contact footer - if no address section, show contact
    if (data.contato.tipo) {
      const footerBoxX = boxX;
      const footerBoxWidth = boxWidth;
      const footerH = 108;

      // Only show contact if there's space
      if (actionY + footerH < baseHeight - 18) {
        ctx.fillStyle = '#20CE90';
        ctx.beginPath();
        ctx.roundRect(footerBoxX, actionY, footerBoxWidth, footerH, 18);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px Montserrat, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Envie seu currículo em:', footerBoxX + footerBoxWidth / 2, actionY + 36);

        // Contact button
        const contactText = data.contato.tipo === 'whatsapp'
          ? data.contato.valor || '(xx) xxxxx-xxxx'
          : data.contato.tipo === 'email'
          ? data.contato.valor || 'email@exemplo.com'
          : 'novotemporh.com.br';

        const btnY = actionY + 54;
        ctx.font = 'bold 24px Montserrat, Arial';
        const btnTextW = ctx.measureText(contactText).width;
        const btnW = btnTextW + 72;
        const btnX = footerBoxX + (footerBoxWidth - btnW) / 2;

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, 42, 21);
        ctx.fill();

        if (data.contato.tipo === 'whatsapp') {
          const whatsappImg = new Image();
          whatsappImg.src = whatsappIcon;
          await new Promise((resolve) => { whatsappImg.onload = resolve; whatsappImg.onerror = resolve; });
          ctx.drawImage(whatsappImg, btnX + 14, btnY + 9, 24, 24);
          ctx.fillStyle = '#11332B';
          ctx.font = 'bold 24px Montserrat, Arial';
          ctx.textAlign = 'left';
          ctx.fillText(contactText, btnX + 44, btnY + 29);
        } else {
          const icon = data.contato.tipo === 'email' ? '✉️' : '🌐';
          ctx.fillStyle = '#11332B';
          ctx.font = 'bold 24px Montserrat, Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${icon} ${contactText}`, footerBoxX + footerBoxWidth / 2, btnY + 29);
        }
        ctx.textAlign = 'left';
      }
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
