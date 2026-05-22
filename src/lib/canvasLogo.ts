/**
 * Desenha a combinação "ícone NT" + "&" + "logo do cliente" dentro de um retângulo.
 * Usado quando a vaga marca a opção "Logo do cliente" (estilo WEG).
 */
export const drawClienteLogoCombo = async (
  ctx: CanvasRenderingContext2D,
  opts: {
    x: number;
    y: number;
    totalWidth: number;
    maxHeight: number;
    ntIconSrc: string;
    clienteLogoUrl?: string | null;
    ampersandColor: string;
    placeholderText?: string;
  }
): Promise<{ height: number }> => {
  const { x, y, totalWidth, maxHeight, ntIconSrc, clienteLogoUrl, ampersandColor, placeholderText } = opts;

  const loadImg = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  const ntIcon = await loadImg(ntIconSrc);
  const clienteLogo = clienteLogoUrl ? await loadImg(clienteLogoUrl) : null;

  const gap = totalWidth * 0.04;
  const ampWidth = totalWidth * 0.12;
  const slotWidth = (totalWidth - ampWidth - gap * 2) / 2;

  const drawCentered = (img: HTMLImageElement, slotX: number) => {
    const aspect = img.width / img.height;
    let w = slotWidth;
    let h = slotWidth / aspect;
    if (h > maxHeight) {
      h = maxHeight;
      w = maxHeight * aspect;
    }
    ctx.drawImage(img, slotX + (slotWidth - w) / 2, y + (maxHeight - h) / 2, w, h);
  };

  if (ntIcon) {
    drawCentered(ntIcon, x);
  }

  // "&"
  ctx.save();
  ctx.fillStyle = ampersandColor;
  ctx.font = `300 ${Math.round(maxHeight * 0.7)}px Montserrat, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('&', x + slotWidth + gap + ampWidth / 2, y + maxHeight / 2);
  ctx.restore();

  const clientSlotX = x + slotWidth + gap + ampWidth + gap;
  if (clienteLogo) {
    drawCentered(clienteLogo, clientSlotX);
  } else {
    ctx.save();
    ctx.fillStyle = ampersandColor;
    ctx.globalAlpha = 0.55;
    ctx.font = `bold 18px Montserrat, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(placeholderText || 'LOGO CLIENTE', clientSlotX + slotWidth / 2, y + maxHeight / 2);
    ctx.restore();
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  return { height: maxHeight };
};
