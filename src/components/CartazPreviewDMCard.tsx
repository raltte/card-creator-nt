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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 1080x1350 (4:5)
    canvas.width = 1080;
    canvas.height = 1350;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo azul DM Card
    ctx.fillStyle = '#1E4FD8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Carregar imagens em paralelo
    const [vemTrabalhar, novoTempoLogo, shapeFundo, estrela, circuloNumero] = await Promise.all([
      loadImage(vemTrabalharImg).catch(() => null),
      loadImage(novoTempoLogoImg).catch(() => null),
      loadImage(shapeFundoImg).catch(() => null),
      loadImage(estrelaImg).catch(() => null),
      loadImage(circuloNumeroImg).catch(() => null),
    ]);

    // "Vem trabalhar com a gente!" - PNG
    if (vemTrabalhar) {
      const vemW = 500;
      const vemH = (vemW * vemTrabalhar.height) / vemTrabalhar.width;
      ctx.drawImage(vemTrabalhar, 50, 60, vemW, vemH);
    }

    // Logo Novo Tempo (canto superior direito)
    if (novoTempoLogo) {
      const logoW = 300;
      const logoH = (logoW * novoTempoLogo.height) / novoTempoLogo.width;
      ctx.drawImage(novoTempoLogo, canvas.width - logoW - 50, 90, logoW, logoH);
    }

    // Função para quebrar texto em linhas
    const wrapText = (text: string, maxWidth: number, fontSize: string): string[] => {
      ctx.font = fontSize;
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = words[0] || '';

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    // Cargo da vaga - título grande
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px Montserrat, Arial';
    ctx.textAlign = 'left';
    
    let y = 340;
    if (data.cargo) {
      const cargoLines = wrapText(data.cargo, 500, 'bold 72px Montserrat, Arial');
      cargoLines.forEach(line => {
        ctx.fillText(line, 50, y);
        y += 90;
      });
    }

    // "Código da vaga:" com círculo
    y += 30;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'italic 32px Georgia, serif';
    ctx.fillText('Código da vaga:', 50, y);
    
    // Círculo com código (PNG)
    if (circuloNumero) {
      const circuloW = 160;
      const circuloH = (circuloW * circuloNumero.height) / circuloNumero.width;
      const circuloX = 265;
      const circuloY = y - circuloH / 2 - 8;
      ctx.drawImage(circuloNumero, circuloX, circuloY, circuloW, circuloH);
      
      // Número do código dentro do círculo
      ctx.fillStyle = '#1E4FD8';
      ctx.font = 'bold 28px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText(data.codigo || '00000', circuloX + circuloW / 2, y + 5);
      ctx.textAlign = 'left';
    }

    // Tipo de contrato + "para atuar em:"
    y += 70;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Montserrat, Arial';
    const tipoText = `Vaga ${data.tipoContrato?.toLowerCase() || 'efetiva'}`;
    ctx.fillText(tipoText, 50, y);
    
    ctx.font = '32px Montserrat, Arial';
    const tipoWidth = ctx.measureText(tipoText).width;
    ctx.fillText(' para atuar em:', 50 + tipoWidth, y);

    // Local com borda arredondada (rosa/coral)
    y += 60;
    const localText = data.local || 'Cidade - UF';
    ctx.font = 'bold 36px Montserrat, Arial';
    const localWidth = ctx.measureText(localText).width;
    const localPadding = 30;
    const localBoxWidth = localWidth + localPadding * 2;
    const localBoxHeight = 60;
    
    ctx.strokeStyle = '#F4A4A4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(50, y - 42, localBoxWidth, localBoxHeight, 30);
    ctx.stroke();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(localText, 50 + localPadding, y);

    // Quadrado branco arredondado (fundo da imagem)
    const whiteBoxWidth = 460;
    const whiteBoxHeight = 580;
    const whiteBoxX = canvas.width - whiteBoxWidth - 60;
    const whiteBoxY = 260;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(whiteBoxX, whiteBoxY, whiteBoxWidth, whiteBoxHeight, 40);
    ctx.fill();

    // Imagem do profissional (ultrapassando o quadrado branco)
    if (data.image && data.image !== '') {
      const personImg = new Image();
      personImg.crossOrigin = 'anonymous';
      
      if (data.image instanceof File) {
        personImg.src = URL.createObjectURL(data.image);
      } else {
        personImg.src = data.image;
      }
      
      await new Promise((resolve) => {
        personImg.onload = resolve;
        personImg.onerror = () => resolve(null);
      });

      if (personImg.complete && personImg.naturalWidth > 0) {
        // Posicionar a imagem para ultrapassar o quadrado branco
        const imgAspect = personImg.width / personImg.height;
        let imgWidth = whiteBoxWidth + 100;
        let imgHeight = imgWidth / imgAspect;
        
        if (imgHeight < whiteBoxHeight + 100) {
          imgHeight = whiteBoxHeight + 100;
          imgWidth = imgHeight * imgAspect;
        }
        
        const imgX = whiteBoxX + (whiteBoxWidth - imgWidth) / 2;
        const imgY = whiteBoxY + whiteBoxHeight - imgHeight + 60;
        
        ctx.drawImage(personImg, imgX, imgY, imgWidth, imgHeight);
      }
    } else {
      // Placeholder quando não há imagem
      ctx.fillStyle = '#E5E7EB';
      ctx.beginPath();
      ctx.roundRect(whiteBoxX + 40, whiteBoxY + 80, whiteBoxWidth - 80, whiteBoxHeight - 120, 20);
      ctx.fill();
      
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '24px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Imagem do', whiteBoxX + whiteBoxWidth / 2, whiteBoxY + 280);
      ctx.fillText('Profissional', whiteBoxX + whiteBoxWidth / 2, whiteBoxY + 320);
      ctx.textAlign = 'left';
    }

    // Shape de fundo azul claro (inscrição) - PNG
    if (shapeFundo) {
      const shapeW = 580;
      const shapeH = (shapeW * shapeFundo.height) / shapeFundo.width;
      const shapeY = canvas.height - shapeH - 20;
      ctx.drawImage(shapeFundo, 0, shapeY, shapeW, shapeH);

      // Texto "Inscreva-se em:" sobre o shape
      ctx.fillStyle = '#11332B';
      ctx.font = '26px Montserrat, Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Inscreva-se em:', 55, shapeY + shapeH * 0.35);

      // URL/Contato com borda
      const contactText = data.contato.tipo === 'whatsapp' 
        ? data.contato.valor || '(xx) xxxxx-xxxx'
        : data.contato.tipo === 'email'
        ? data.contato.valor || 'email@exemplo.com'
        : 'novotemporh.com.br';
      
      ctx.font = 'bold 28px Montserrat, Arial';
      ctx.fillStyle = '#1E4FD8';
      ctx.fillText(contactText, 80, shapeY + shapeH * 0.70);
    }

    // Estrela decorativa (sobreposta) - PNG
    if (estrela) {
      const estrelaW = 120;
      const estrelaH = (estrelaW * estrela.height) / estrela.width;
      const estrelaX = whiteBoxX - 30;
      const estrelaY = whiteBoxY + whiteBoxHeight - 50;
      ctx.drawImage(estrela, estrelaX, estrelaY, estrelaW, estrelaH);
    }

    // Tarja azul PCD no topo se for vaga PCD
    if (data.isPcd) {
      ctx.fillStyle = '#3B5998';
      ctx.fillRect(0, 0, canvas.width, 67);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('*Vaga exclusiva ou afirmativa para Pessoa com Deficiência', canvas.width / 2, 43);
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