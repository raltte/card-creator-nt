import { useEffect, useRef } from "react";
import { CartazData } from "./CartazGenerator";
import logoNT from "@/assets/novo-tempo-logo-branco.png";
import shapeFundo from "@/assets/dm-card/shape-fundo.png";
import estrela from "@/assets/dm-card/estrela.png";
import circuloNumero from "@/assets/dm-card/circulo-numero-vaga.png";

interface CartazPreviewDMCardProps {
  data: CartazData;
}

export const CartazPreviewDMCard = ({ data }: CartazPreviewDMCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // "Vem trabalhar" - fonte cursiva
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'italic 64px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('Vem trabalhar', 60, 120);
    
    // "com a gente!" - fonte cursiva maior
    ctx.font = 'italic bold 72px Georgia, serif';
    ctx.fillText('com a gente!', 60, 200);

    // Logo Novo Tempo (canto superior direito)
    const logoNTImg = new Image();
    logoNTImg.src = logoNT;
    await new Promise((resolve) => {
      logoNTImg.onload = resolve;
      logoNTImg.onerror = resolve;
    });
    
    const logoNTWidth = 280;
    const logoNTHeight = (logoNTWidth * logoNTImg.height) / logoNTImg.width;
    ctx.drawImage(logoNTImg, canvas.width - logoNTWidth - 50, 70, logoNTWidth, logoNTHeight);

    // Cargo da vaga - título grande
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px Montserrat, Arial';
    ctx.textAlign = 'left';
    
    const wrapText = (text: string, maxWidth: number, fontSize: string) => {
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

    let y = 340;
    if (data.cargo) {
      const cargoLines = wrapText(data.cargo, 500, 'bold 72px Montserrat, Arial');
      cargoLines.forEach(line => {
        ctx.fillText(line, 60, y);
        y += 85;
      });
    }

    // Código da vaga com círculo
    y += 40;
    
    // Desenhar círculo do número da vaga
    const circuloImg = new Image();
    circuloImg.src = circuloNumero;
    await new Promise((resolve) => {
      circuloImg.onload = resolve;
      circuloImg.onerror = resolve;
    });
    
    // "Código da vaga:" texto
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'italic 32px Georgia, serif';
    ctx.fillText('Código da vaga:', 60, y);
    
    // Círculo com código
    const circuloWidth = 120;
    const circuloHeight = 48;
    const codigoX = 280;
    ctx.drawImage(circuloImg, codigoX, y - 35, circuloWidth, circuloHeight);
    
    // Número do código dentro do círculo
    ctx.fillStyle = '#1E4FD8';
    ctx.font = 'bold 28px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(data.codigo || '00000', codigoX + circuloWidth / 2, y - 5);
    ctx.textAlign = 'left';

    // Tipo de contrato + Local
    y += 60;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Montserrat, Arial';
    const tipoText = `Vaga ${data.tipoContrato?.toLowerCase() || 'efetiva'}`;
    ctx.fillText(tipoText, 60, y);
    
    ctx.font = '32px Montserrat, Arial';
    const tipoWidth = ctx.measureText(tipoText).width;
    ctx.fillText(' para atuar em:', 60 + tipoWidth, y);

    // Local com borda arredondada
    y += 55;
    const localText = data.local || 'Cidade - UF';
    ctx.font = 'bold 36px Montserrat, Arial';
    const localWidth = ctx.measureText(localText).width;
    const localPadding = 40;
    const localBoxWidth = localWidth + localPadding * 2;
    const localBoxHeight = 60;
    
    // Borda do local (rosa/coral)
    ctx.strokeStyle = '#F4A4A4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(60, y - 40, localBoxWidth, localBoxHeight, 30);
    ctx.stroke();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(localText, 60 + localPadding, y);

    // Shape de fundo azul claro (inscrição)
    const shapeImg = new Image();
    shapeImg.src = shapeFundo;
    await new Promise((resolve) => {
      shapeImg.onload = resolve;
      shapeImg.onerror = resolve;
    });
    
    const shapeWidth = 520;
    const shapeHeight = 160;
    const shapeY = canvas.height - shapeHeight - 80;
    ctx.drawImage(shapeImg, 0, shapeY, shapeWidth, shapeHeight);

    // Texto "Inscreva-se em:"
    ctx.fillStyle = '#11332B';
    ctx.font = '28px Montserrat, Arial';
    ctx.fillText('Inscreva-se em:', 50, shapeY + 50);

    // URL/Contato com borda
    const contactText = data.contato.tipo === 'whatsapp' 
      ? data.contato.valor || '(xx) xxxxx-xxxx'
      : data.contato.tipo === 'email'
      ? data.contato.valor || 'email@exemplo.com'
      : 'novotemporh.com.br';
    
    ctx.font = 'bold 32px Montserrat, Arial';
    const contactWidth = ctx.measureText(contactText).width;
    const contactPadding = 30;
    const contactBoxWidth = contactWidth + contactPadding * 2;
    const contactBoxHeight = 50;
    const contactY = shapeY + 100;
    
    // Borda azul escuro
    ctx.strokeStyle = '#1E4FD8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(50, contactY - 35, contactBoxWidth, contactBoxHeight, 25);
    ctx.stroke();
    
    ctx.fillStyle = '#1E4FD8';
    ctx.fillText(contactText, 50 + contactPadding, contactY);

    // Quadrado branco arredondado (fundo da imagem)
    const whiteBoxWidth = 480;
    const whiteBoxHeight = 620;
    const whiteBoxX = canvas.width - whiteBoxWidth - 40;
    const whiteBoxY = 250;
    
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
        personImg.onerror = () => {
          console.error('Erro ao carregar imagem');
          resolve(null);
        };
      });

      // Posicionar a imagem para ultrapassar o quadrado branco
      const imgMaxHeight = whiteBoxHeight + 120; // Ultrapassar um pouco
      const imgAspect = personImg.width / personImg.height;
      let imgWidth = whiteBoxWidth + 80;
      let imgHeight = imgWidth / imgAspect;
      
      if (imgHeight < imgMaxHeight) {
        imgHeight = imgMaxHeight;
        imgWidth = imgHeight * imgAspect;
      }
      
      const imgX = whiteBoxX + (whiteBoxWidth - imgWidth) / 2;
      const imgY = whiteBoxY + whiteBoxHeight - imgHeight + 40;
      
      ctx.drawImage(personImg, imgX, imgY, imgWidth, imgHeight);
    } else {
      // Placeholder quando não há imagem
      ctx.fillStyle = '#E5E7EB';
      ctx.beginPath();
      ctx.roundRect(whiteBoxX + 40, whiteBoxY + 100, whiteBoxWidth - 80, whiteBoxHeight - 150, 20);
      ctx.fill();
      
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '24px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Imagem do', whiteBoxX + whiteBoxWidth / 2, whiteBoxY + 300);
      ctx.fillText('Profissional', whiteBoxX + whiteBoxWidth / 2, whiteBoxY + 340);
      ctx.textAlign = 'left';
    }

    // Estrela decorativa (sobreposta)
    const estrelaImg = new Image();
    estrelaImg.src = estrela;
    await new Promise((resolve) => {
      estrelaImg.onload = resolve;
      estrelaImg.onerror = resolve;
    });
    
    const estrelaSize = 100;
    const estrelaX = whiteBoxX - 20;
    const estrelaY = whiteBoxY + whiteBoxHeight - 30;
    ctx.drawImage(estrelaImg, estrelaX, estrelaY, estrelaSize, estrelaSize);

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