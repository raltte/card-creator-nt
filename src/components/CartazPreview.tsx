import { useEffect, useRef } from "react";
import { Phone, Globe, Mail, User } from "lucide-react";
import { CartazData } from "./CartazGenerator";
import logoImage from "@/assets/novo-tempo-logo.png";

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
    return '🌐 novotemporh.com.br';
  };

  const generateTemplateImage = async (templateId: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(`
          <svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="500" fill="#f3f4f6"/>
            <text x="200" y="250" text-anchor="middle" font-family="Arial" font-size="24" fill="#9ca3af">Template</text>
          </svg>
        `);
        img.onload = () => resolve(img);
        return;
      }

      // Criar um gradiente baseado no tipo de template
      const gradient = ctx.createLinearGradient(0, 0, 400, 500);
      
      switch (templateId) {
        case 'admin':
          gradient.addColorStop(0, '#f8fafc');
          gradient.addColorStop(1, '#e2e8f0');
          break;
        case 'industrial':
          gradient.addColorStop(0, '#fff7ed');
          gradient.addColorStop(1, '#fed7aa');
          break;
        case 'comercial':
          gradient.addColorStop(0, '#f0f9ff');
          gradient.addColorStop(1, '#bae6fd');
          break;
        case 'operacional':
          gradient.addColorStop(0, '#f7fee7');
          gradient.addColorStop(1, '#bbf7d0');
          break;
        case 'estagio':
          gradient.addColorStop(0, '#fef7ff');
          gradient.addColorStop(1, '#f3e8ff');
          break;
        default:
          gradient.addColorStop(0, '#f3f4f6');
          gradient.addColorStop(1, '#d1d5db');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 500);

      // Adicionar ícone representativo
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👤', 200, 200);
      
      ctx.font = '20px Arial';
      ctx.fillText(templateId.charAt(0).toUpperCase() + templateId.slice(1), 200, 250);

      const img = new Image();
      img.src = canvas.toDataURL();
      img.onload = () => resolve(img);
    });
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

    // Lado esquerdo - imagem (50% da largura)
    let leftImage: HTMLImageElement;
    
    if (data.image instanceof File) {
      leftImage = new Image();
      leftImage.src = URL.createObjectURL(data.image);
      await new Promise((resolve) => {
        leftImage.onload = resolve;
      });
    } else if (typeof data.image === 'string' && data.image) {
      leftImage = await generateTemplateImage(data.image);
    } else {
      // Imagem padrão
      leftImage = new Image();
      leftImage.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="480" height="1200" xmlns="http://www.w3.org/2000/svg">
          <rect width="480" height="1200" fill="#f3f4f6"/>
          <text x="240" y="600" text-anchor="middle" font-family="Arial" font-size="32" fill="#9ca3af">Imagem</text>
        </svg>
      `);
      await new Promise((resolve) => {
        leftImage.onload = resolve;
      });
    }

    // Desenhar imagem do lado esquerdo com object-fit: cover
    const imageAspect = leftImage.width / leftImage.height;
    const canvasAspect = 480 / 1200;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imageAspect > canvasAspect) {
      // Imagem é mais larga - cortar nas laterais
      drawHeight = 1200;
      drawWidth = 1200 * imageAspect;
      offsetX = -(drawWidth - 480) / 2;
      offsetY = 0;
    } else {
      // Imagem é mais alta - cortar no topo/fundo
      drawWidth = 480;
      drawHeight = 480 / imageAspect;
      offsetX = 0;
      offsetY = -(drawHeight - 1200) / 2;
    }
    
    ctx.drawImage(leftImage, offsetX, offsetY, drawWidth, drawHeight);

    // Lado direito - fundo verde escuro com canto superior direito arredondado
    ctx.fillStyle = '#11332B';
    ctx.beginPath();
    ctx.roundRect(480, 0, 480, 1008, [0, 24, 0, 0]);
    ctx.fill();

    // Logo Novo Tempo (topo direito) - posicionamento exato
    const logo = new Image();
    logo.src = logoImage;
    await new Promise((resolve) => {
      logo.onload = resolve;
    });
    ctx.drawImage(logo, 520, 24, 400, 96);

    // "Vaga de emprego" - título principal (posição igual ao exemplo)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 64px Montserrat, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Vaga de', 520, 200);
    ctx.fillText('emprego', 520, 280);

    // Dados da vaga - começando na posição correta
    let y = 360;
    
    if (data.cargo) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px Montserrat, Arial';
      ctx.fillText(`Vaga: ${data.cargo}`, 520, y);
    }
    y += 56;

    if (data.local) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '32px Montserrat, Arial';
      ctx.fillText(`Local: ${data.local}`, 520, y);
    }
    y += 56;

    if (data.codigo) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '32px Montserrat, Arial';
      ctx.fillText(`Código: ${data.codigo}`, 520, y);
    }
    y += 72;

    // Tipo de contrato
    if (data.tipoContrato) {
      ctx.fillStyle = '#20CE90';
      ctx.font = 'bold 28px Montserrat, Arial';
      ctx.fillText('Tipo de contrato:', 520, y);
      y += 40;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '28px Montserrat, Arial';
      ctx.fillText(data.tipoContrato, 520, y);
    }
    y += 72;

    // Requisitos
    if (data.requisitos) {
      ctx.fillStyle = '#20CE90';
      ctx.font = 'bold 28px Montserrat, Arial';
      const requisitosTitle = data.tipoContrato === 'Temporário' ? 'Requisitos:' : 'Requisitos e atividades:';
      ctx.fillText(requisitosTitle, 520, y);
      y += 48;

      // Quebrar texto dos requisitos com espaçamento correto
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px Montserrat, Arial';
      const lines = data.requisitos.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          ctx.fillText(line, 520, y);
          y += 36;
        }
      });
    }

    // "Saiba mais na legenda" - posicionamento exato
    y += 32;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Montserrat, Arial';
    ctx.fillText('Saiba mais na ', 520, y);
    
    // Medir texto para posicionar "legenda" em verde
    const textWidth = ctx.measureText('Saiba mais na ').width;
    ctx.fillStyle = '#20CE90';
    ctx.font = 'bold 24px Montserrat, Arial';
    ctx.fillText('legenda.', 520 + textWidth, y);

    // Barra de contato verde claro na parte inferior
    ctx.fillStyle = '#20CE90';
    ctx.fillRect(480, 1008, 480, 192);

    // Texto do contato
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Envie seu currículo em:', 720, 1068);

    // Texto fixo do contato: novotemporh.com.br
    const contactText = getContactDisplay();
    ctx.font = 'bold 24px Montserrat, Arial';
    const textMetrics = ctx.measureText(contactText);
    const buttonWidth = textMetrics.width + 48;
    const buttonHeight = 48;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(720 - buttonWidth/2, 1116 - buttonHeight/2, buttonWidth, buttonHeight, 24);
    ctx.fill();
    
    // Texto do contato
    ctx.fillStyle = '#11332B';
    ctx.font = 'bold 24px Montserrat, Arial';
    ctx.fillText(contactText, 720, 1140);
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