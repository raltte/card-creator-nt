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

    // ── Load logos ──
    const logoNT = new Image();
    logoNT.src = logoNTIcon;
    const logoBomb = new Image();
    logoBomb.src = logoBombril;
    await Promise.all([
      new Promise(r => { logoNT.onload = r; logoNT.onerror = r; }),
      new Promise(r => { logoBomb.onload = r; logoBomb.onerror = r; })
    ]);

    // ── Pre-calculate heights ──

    // Logo
    const logoH = 100;
    const bombAspect = logoBomb.width / logoBomb.height;
    const bombW = logoH * bombAspect;
    const ntSize = logoH;
    const ampGap = 18;
    const logoToBox = 24;

    // Red box
    const titleLine1 = data.tipoMutirao === 'Entrevistas' ? 'Mutirão de'
      : data.tipoMutirao === 'Curriculos' ? 'Entrega de'
      : (data.mensagemExtra || 'Mutirão');
    const titleLine2 = data.tipoMutirao === 'Entrevistas' ? 'Entrevistas'
      : data.tipoMutirao === 'Curriculos' ? 'Currículos'
      : data.tipoMutirao === 'Personalizado' ? '' : data.tipoMutirao;

    const cargoText = `Vaga: ${data.cargo || 'Cargo'}`;
    const cargoFont = 'bold 42px Montserrat, Arial';
    const cargoLines = wrap(cargoText, innerW, cargoFont);

    // Parse details into structured blocks with proper spacing
    const parseDetails = () => {
      if (!data.detalhes) return [];
      const lines = data.detalhes.split('\n');
      const blocks: { text: string; bold: boolean }[] = [];
      lines.forEach(line => {
        if (line.trim()) {
          const isBold = /^(Turno|Segunda|Benefícios|Horário|Disponibilidade)/i.test(line.trim());
          blocks.push({ text: line.trim(), bold: isBold });
        } else {
          blocks.push({ text: '', bold: false }); // spacer
        }
      });
      return blocks;
    };
    const detailBlocks = parseDetails();

    let redH = 44; // top pad
    redH += 60; // title 1
    if (titleLine2) redH += 66;
    redH += 8;
    redH += cargoLines.length * 50;
    if (data.tipoContrato) { redH += 20; redH += 32; }
    if (detailBlocks.length > 0) {
      redH += 16;
      detailBlocks.forEach(block => {
        if (block.text === '') {
          redH += 16; // empty line spacer
        } else {
          const font = block.bold ? 'bold 28px Montserrat, Arial' : '26px Montserrat, Arial';
          const wrapped = wrap(block.text, innerW, font);
          redH += wrapped.length * (block.bold ? 38 : 34);
        }
      });
    }
    redH += 44; // bottom pad

    // Action section — all blocks same style, same width, same font
    const actionGap = 16;
    let actionH = 0;
    const actionFont = 'bold 24px Montserrat, Arial';
    const actionPad = 32;

    // Build action blocks: each is { lines[], color }
    const actionBlocks: { lines: string[]; color: string }[] = [];

    // 1) Instruction (deadline + address hint)
    if (data.dataPrazo || data.localEntrega) {
      const instrText = data.tipoMutirao === 'Curriculos'
        ? (data.dataPrazo ? `Entregue seu currículo ${data.dataPrazo} no endereço abaixo.` : 'Entregue seu currículo no endereço abaixo.')
        : (data.dataPrazo ? `Compareça com o currículo em mãos ${data.dataPrazo} no endereço abaixo.` : 'Compareça com o currículo em mãos no endereço abaixo.');
      actionBlocks.push({ lines: wrap(instrText, boxW - actionPad * 2, actionFont), color: '#E53935' });
    }

    // 2) Address
    if (data.localEntrega) {
      const addrText = `Local de Entrega: ${data.localEntrega}`;
      actionBlocks.push({ lines: wrap(addrText, boxW - actionPad * 2, actionFont), color: '#E53935' });
    }

    // 3) Extra message
    if (data.mensagemExtra && data.tipoMutirao !== 'Personalizado') {
      actionBlocks.push({ lines: wrap(data.mensagemExtra, boxW - actionPad * 2, actionFont), color: '#E53935' });
    }

    // Calculate total action height
    actionBlocks.forEach((block, i) => {
      const blockH = block.lines.length * 32 + actionPad;
      actionH += blockH;
      if (i < actionBlocks.length - 1) actionH += actionGap;
    });

    // ── Contact (only whatsapp/email, NOT site) ──
    if (showContact) {
      rr(boxX, y, boxW, contactH, 18, '#20CE90');

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
        id="cartaz-canvas"
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};
