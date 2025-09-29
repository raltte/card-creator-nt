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

  const getContactDisplay = (contato: CartazData['contato']) => {
    if (contato.tipo === 'whatsapp') {
      return `📱 ${contato.valor}`;
    }
    return contato.valor;
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

    // Configurar canvas
    canvas.width = 800;
    canvas.height = 1000;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Lado esquerdo - imagem
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
        <svg width="400" height="1000" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="1000" fill="#f3f4f6"/>
          <text x="200" y="500" text-anchor="middle" font-family="Arial" font-size="32" fill="#9ca3af">Imagem</text>
        </svg>
      `);
      await new Promise((resolve) => {
        leftImage.onload = resolve;
      });
    }

    // Desenhar imagem do lado esquerdo
    ctx.drawImage(leftImage, 0, 0, 400, 1000);

    // Lado direito - fundo verde escuro com canto arredondado
    ctx.fillStyle = '#11332B';
    ctx.beginPath();
    ctx.roundRect(400, 0, 400, 840, [0, 20, 0, 0]);
    ctx.fill();

    // Logo Novo Tempo (topo direito)
    const logo = new Image();
    logo.src = logoImage;
    await new Promise((resolve) => {
      logo.onload = resolve;
    });
    ctx.drawImage(logo, 420, 20, 360, 80);

    // "Vaga de emprego" - título principal
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 56px Montserrat, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Vaga de', 420, 160);
    ctx.fillText('emprego', 420, 220);

    // Dados da vaga
    let y = 280;
    
    if (data.cargo) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px Montserrat, Arial';
      ctx.fillText(`Vaga: ${data.cargo}`, 420, y);
    }
    y += 50;

    if (data.local) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '28px Montserrat, Arial';
      ctx.fillText(`Local: ${data.local}`, 420, y);
    }
    y += 50;

    if (data.codigo) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '28px Montserrat, Arial';
      ctx.fillText(`Código: ${data.codigo}`, 420, y);
    }
    y += 60;

    // Tipo de contrato
    if (data.tipoContrato) {
      ctx.fillStyle = '#20CE90';
      ctx.font = 'bold 24px Montserrat, Arial';
      ctx.fillText('Tipo de contrato:', 420, y);
      y += 35;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px Montserrat, Arial';
      ctx.fillText(data.tipoContrato, 420, y);
    }
    y += 60;

    // Requisitos
    if (data.requisitos) {
      ctx.fillStyle = '#20CE90';
      ctx.font = 'bold 24px Montserrat, Arial';
      const requisitosTitle = data.tipoContrato === 'Temporário' ? 'Requisitos:' : 'Requisitos e atividades:';
      ctx.fillText(requisitosTitle, 420, y);
      y += 40;

      // Quebrar texto dos requisitos
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Montserrat, Arial';
      const lines = data.requisitos.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          ctx.fillText(line, 420, y);
          y += 30;
        }
      });
    }

    // "Saiba mais na legenda"
    y += 20;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Montserrat, Arial';
    ctx.fillText('Saiba mais na ', 420, y);
    
    // Medir texto para posicionar "legenda" em verde
    const textWidth = ctx.measureText('Saiba mais na ').width;
    ctx.fillStyle = '#20CE90';
    ctx.font = 'bold 20px Montserrat, Arial';
    ctx.fillText('legenda.', 420 + textWidth, y);

    // Barra de contato (verde claro)
    ctx.fillStyle = '#20CE90';
    ctx.fillRect(400, 840, 400, 160);

    // Texto do contato
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Envie seu currículo em:', 600, 890);

    if (data.contato.valor) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px Montserrat, Arial';
      
      // Fundo branco para o contato
      const contactText = getContactDisplay(data.contato);
      const textMetrics = ctx.measureText(contactText);
      const textWidth = textMetrics.width + 40;
      const textHeight = 40;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(600 - textWidth/2, 920 - textHeight/2, textWidth, textHeight, 20);
      ctx.fill();
      
      // Texto do contato
      ctx.fillStyle = '#11332B';
      ctx.font = 'bold 20px Montserrat, Arial';
      ctx.fillText(contactText, 600, 945);
    }
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