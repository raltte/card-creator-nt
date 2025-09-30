import { useEffect, useRef } from "react";
import { Phone, Globe, Mail, User, MessageCircle } from "lucide-react";
import { CartazData } from "./CartazGenerator";
import logoImage from "@/assets/novo-tempo-logo-v4.png";

interface CartazPreviewProps {
  data: CartazData;
}

export const CartazPreview = ({ data }: CartazPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getContactIcon = (tipo: string) => {
    switch (tipo) {
      case 'whatsapp': return '📱';
      case 'email': return '✉️';
      case 'site': return '🌐';
      default: return '🌐';
    }
  };

  const getContactDisplay = () => {
    switch (data.contato.tipo) {
      case 'whatsapp':
        return `📱 ${data.contato.valor || '(xx) xxxxx-xxxx'}`;
      case 'email':
        return `✉️ ${data.contato.valor}`;
      case 'site':
      default:
        return '🌐 novotemporh.com.br';
    }
  };


  const drawCartaz = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas com proporção 4:5 (960x1200)
    canvas.width = 960;
    canvas.height = 1200;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tarja azul PCD no topo (se for vaga PCD)
    if (data.isPcd) {
      ctx.fillStyle = '#3B5998'; // Azul Facebook/Profissional
      ctx.fillRect(0, 0, canvas.width, 60);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('*Vaga exclusiva ou afirmativa para Pessoa com Deficiência', canvas.width / 2, 38);
      ctx.textAlign = 'left';
    }

    // Ajustar posições se for vaga PCD
    const topOffset = data.isPcd ? 60 : 0;
    const availableHeight = data.isPcd ? 1140 : 1200;

    // Lado esquerdo - imagem (45% da largura)
    let leftImage: HTMLImageElement;
    
    if (data.image && data.image !== '') {
      leftImage = new Image();
      leftImage.crossOrigin = 'anonymous';
      
      if (data.image instanceof File) {
        leftImage.src = URL.createObjectURL(data.image);
      } else {
        // Imagem da IA (URL ou base64)
        leftImage.src = data.image;
      }
      
      await new Promise((resolve, reject) => {
        leftImage.onload = resolve;
        leftImage.onerror = () => {
          console.error('Erro ao carregar imagem:', data.image);
          resolve(null); // Usar imagem padrão em caso de erro
        };
      });
    } else {
      // Imagem padrão quando não há imagem
      leftImage = new Image();
      leftImage.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="432" height="${availableHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="432" height="${availableHeight}" fill="#f3f4f6"/>
          <text x="216" y="${availableHeight/2}" text-anchor="middle" font-family="Arial" font-size="32" fill="#9ca3af">Imagem</text>
        </svg>
      `);
      await new Promise((resolve) => {
        leftImage.onload = resolve;
      });
    }

    // Desenhar imagem do lado esquerdo com object-fit: cover
    const imageAspect = leftImage.width / leftImage.height;
    const canvasAspect = 432 / availableHeight;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imageAspect > canvasAspect) {
      // Imagem é mais larga - cortar nas laterais
      drawHeight = availableHeight;
      drawWidth = availableHeight * imageAspect;
      offsetX = -(drawWidth - 432) / 2;
      offsetY = topOffset;
    } else {
      // Imagem é mais alta - cortar no topo/fundo
      drawWidth = 432;
      drawHeight = 432 / imageAspect;
      offsetX = 0;
      offsetY = topOffset - (drawHeight - availableHeight) / 2;
    }
    
    ctx.drawImage(leftImage, offsetX, offsetY, drawWidth, drawHeight);

    // Lado direito - fundo verde escuro com canto superior direito arredondado
    const rightHeight = data.isPcd ? 948 : 1008;
    ctx.fillStyle = '#11332B';
    ctx.beginPath();
    ctx.roundRect(432, topOffset, 528, rightHeight, [0, 24, 0, 0]);
    ctx.fill();

    // Logo Novo Tempo (topo direito) - proporção mantida para evitar distorção
    const logo = new Image();
    logo.src = logoImage;
    await new Promise((resolve) => {
      logo.onload = resolve;
    });
    // Calcular proporção correta com logo maior e margem equilibrada
    const logoWidth = 360;
    const logoHeight = (logoWidth * logo.height) / logo.width;
    ctx.drawImage(logo, 456, topOffset + 80, logoWidth, logoHeight);

    // "Vaga de emprego" - título principal centralizado verticalmente
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 64px Montserrat, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Vaga de', 456, topOffset + 280);
    ctx.fillText('emprego', 456, topOffset + 333);

    // Badge PCD ao lado do título (se for vaga PCD)
    if (data.isPcd) {
      const textWidth = ctx.measureText('emprego').width;
      const badgeX = 456 + textWidth + 24;
      const badgeY = topOffset + 305;
      
      ctx.fillStyle = '#3B5998';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, 100, 48, 24);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Montserrat, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PCD', badgeX + 50, badgeY + 30);
      ctx.textAlign = 'left';
    }

    // Função auxiliar para quebrar texto
    const wrapText = (text: string, maxWidth: number, fontSize: string) => {
      ctx.font = fontSize;
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0];

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

    // Dados da vaga - começando na posição centralizada
    let y = topOffset + 400;
    const maxTextWidth = 464; // Margem de 40px da direita (960 - 456 - 40)
    
    if (data.cargo) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px Montserrat, Arial';
      const cargoLines = wrapText(data.cargo, maxTextWidth, 'bold 30px Montserrat, Arial');
      cargoLines.forEach(line => {
        ctx.fillText(line, 456, y);
        y += 36;
      });
    }
    y += 16;

    if (data.local) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px Montserrat, Arial';
      ctx.fillText('Local: ', 456, y);
      
      const localWidth = ctx.measureText('Local: ').width;
      ctx.font = '26px Montserrat, Arial';
      const localLines = wrapText(data.local, maxTextWidth - localWidth, '26px Montserrat, Arial');
      localLines.forEach((line, index) => {
        if (index === 0) {
          ctx.fillText(line, 456 + localWidth, y);
        } else {
          ctx.fillText(line, 456, y);
        }
        y += 32;
      });
    }
    y += 16;

    if (data.codigo) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px Montserrat, Arial';
      ctx.fillText('Código: ', 456, y);
      
      const codigoWidth = ctx.measureText('Código: ').width;
      ctx.font = '26px Montserrat, Arial';
      ctx.fillText(data.codigo, 456 + codigoWidth, y);
    }
    y += 56;

    // Tipo de contrato
    if (data.tipoContrato) {
      ctx.fillStyle = '#20CE90';
      ctx.font = 'bold 28px Montserrat, Arial';
      ctx.fillText('Tipo de contrato:', 456, y);
      y += 40;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '28px Montserrat, Arial';
      ctx.fillText(data.tipoContrato, 456, y);
    }
    y += 56;

    // Requisitos
    if (data.requisitos) {
      ctx.fillStyle = '#20CE90';
      ctx.font = 'bold 28px Montserrat, Arial';
      const requisitosTitle = data.tipoContrato === 'Temporário' ? 'Requisitos:' : 'Requisitos e atividades:';
      ctx.fillText(requisitosTitle, 456, y);
      y += 44;

      // Quebrar texto dos requisitos com espaçamento correto
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px Montserrat, Arial';
      const lines = data.requisitos.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          // Adicionar bullet point se não existir
          const lineWithBullet = line.startsWith('•') ? line : `• ${line}`;
          const wrappedLines = wrapText(lineWithBullet, maxTextWidth, '24px Montserrat, Arial');
          wrappedLines.forEach((wrappedLine, index) => {
            // Para linhas continuadas, adicionar indentação
            const x = index === 0 ? 456 : 476;
            ctx.fillText(wrappedLine, x, y);
            y += 32;
          });
        }
      });
    }

    // "Saiba mais na legenda" - posicionamento exato
    y += 32;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '26px Montserrat, Arial';
    ctx.fillText('Saiba mais na ', 456, y);
    
    // Medir texto para posicionar "legenda" em verde
    const textWidth = ctx.measureText('Saiba mais na ').width;
    ctx.fillStyle = '#20CE90';
    ctx.font = 'bold 26px Montserrat, Arial';
    ctx.fillText('legenda.', 456 + textWidth, y);

    // Barra de contato verde claro na parte inferior
    const footerY = topOffset + rightHeight;
    ctx.fillStyle = '#20CE90';
    ctx.fillRect(432, footerY, 528, 192);

    // Texto do contato
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Envie seu currículo em:', 696, footerY + 60);

    // Texto fixo do contato: novotemporh.com.br
    const contactText = getContactDisplay();
    
    // Medir o texto "Envie seu currículo em:" para usar a mesma largura
    ctx.font = 'bold 32px Montserrat, Arial';
    const headerTextMetrics = ctx.measureText('Envie seu currículo em:');
    const buttonWidth = headerTextMetrics.width;
    const buttonHeight = 48;
    const buttonY = footerY + 108;
    
    // Desenhar o fundo branco centralizado
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(696 - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 24);
    ctx.fill();
    
    // Texto do contato centralizado verticalmente e horizontalmente
    ctx.fillStyle = '#11332B';
    ctx.font = 'bold 24px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(contactText, 696, buttonY);
  };

  useEffect(() => {
    drawCartaz();
  }, [data]);

  return (
    <div className="cartaz-container bg-white rounded-lg shadow-lg overflow-hidden">
      <canvas 
        ref={canvasRef}
        id="cartaz-canvas"
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};