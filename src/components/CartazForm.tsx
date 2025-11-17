import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Upload, Globe, MessageCircle, Mail, Wand2 } from "lucide-react";
import { CartazData } from "./CartazGenerator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageFraming } from "./ImageFraming";

interface CartazFormProps {
  data: CartazData;
  onChange: (data: CartazData) => void;
}

export const CartazForm = ({ data, onChange }: CartazFormProps) => {
  const { toast } = useToast();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showFraming, setShowFraming] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  const updateData = (field: keyof CartazData | string, value: any) => {
    console.log('updateData called:', field, value);
    if (field === 'contato.tipo' || field === 'contato.valor') {
      const [parent, child] = field.split('.');
      onChange({
        ...data,
        [parent]: {
          ...data.contato,
          [child]: value
        }
      });
    } else {
      onChange({
        ...data,
        [field]: value
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTempImageUrl(url);
      setShowFraming(true);
    }
  };

  const handleGenerateAIImage = async () => {
    if (!data.cargo) {
      toast({
        title: "Campo obrigatório",
        description: "Preencha o cargo antes de gerar a imagem.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-job-images', {
        body: {
          jobTitle: data.cargo,
          sector: "Geral",
          contractType: data.tipoContrato,
          requirements: [],
          clientTemplate: data.clientTemplate,
        }
      });

      if (error) throw error;

      if (result.images && result.images.length > 0) {
        setTempImageUrl(result.images[0]);
        setShowFraming(true);
      } else {
        throw new Error('Nenhuma imagem foi gerada');
      }
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar imagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleFramingComplete = (croppedImageData: string) => {
    updateData('image', croppedImageData);
    setShowFraming(false);
    setTempImageUrl(null);
  };

  const handleBackFromFraming = () => {
    setShowFraming(false);
    setTempImageUrl(null);
  };

  const handleContactTypeChange = (tipo: 'site' | 'whatsapp' | 'email') => {
    console.log('Contact type changing to:', tipo);
    updateData('contato.tipo', tipo);
    
    // Set default values for each type
    switch (tipo) {
      case 'site':
        updateData('contato.valor', 'novotemporh.com.br');
        break;
      case 'whatsapp':
        updateData('contato.valor', '');
        break;
      case 'email':
        updateData('contato.valor', 'email@novotemporh.com.br');
        break;
    }
  };

  const formatWhatsAppNumber = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (xx) xxxxx-xxxx
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleWhatsAppChange = (value: string) => {
    const formatted = formatWhatsAppNumber(value);
    updateData('contato.valor', formatted);
  };

  // Se estiver na tela de enquadramento
  if (showFraming && tempImageUrl) {
    return (
      <ImageFraming
        imageUrl={tempImageUrl}
        onFramingComplete={handleFramingComplete}
        onBack={handleBackFromFraming}
        modelType={data.clientTemplate === 'marisa' ? 'tradicional-marisa' : 'tradicional-nt'}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Seleção de Cliente */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Template do Cliente</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => updateData('clientTemplate', 'padrao')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              data.clientTemplate === 'padrao' 
                ? 'border-nt-light bg-nt-light/5' 
                : 'border-border hover:border-nt-light/50'
            }`}
          >
            <div className="font-semibold">Padrão</div>
            <div className="text-sm text-muted-foreground">Novo Tempo RH</div>
          </button>
          <button
            type="button"
            onClick={() => updateData('clientTemplate', 'marisa')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              data.clientTemplate === 'marisa' 
                ? 'border-nt-light bg-nt-light/5' 
                : 'border-border hover:border-nt-light/50'
            }`}
          >
            <div className="font-semibold">Marisa</div>
            <div className="text-sm text-muted-foreground">Layout personalizado</div>
          </button>
        </div>
      </div>

      {/* Imagem */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Imagem Ilustrativa</Label>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-nt-light transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">
                  Upload
                </div>
              </div>
            </label>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateAIImage}
            disabled={isGeneratingImage || !data.cargo}
            className="h-full"
          >
            <div className="flex flex-col items-center gap-2">
              <Wand2 className="w-6 h-6" />
              <div className="text-xs">
                {isGeneratingImage ? 'Gerando...' : 'Gerar com IA'}
              </div>
            </div>
          </Button>
        </div>

        {data.image && (
          <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-nt-light">
            <img
              src={typeof data.image === 'string' ? data.image : URL.createObjectURL(data.image)}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Vaga PCD */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="pcd" className="text-base font-semibold">Vaga PCD</Label>
          <div className="text-sm text-muted-foreground">
            Vaga exclusiva ou afirmativa para Pessoa com Deficiência
          </div>
        </div>
        <Switch
          id="pcd"
          checked={data.isPcd}
          onCheckedChange={(checked) => updateData('isPcd', checked)}
        />
      </div>

      {/* Dados da vaga */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="cargo">Cargo da Vaga *</Label>
          <Input
            id="cargo"
            placeholder="Ex: Operador de Produção"
            value={data.cargo}
            onChange={(e) => updateData('cargo', e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="local">Local *</Label>
            <Input
              id="local"
              placeholder="Ex: Resende - RJ"
              value={data.local}
              onChange={(e) => updateData('local', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              placeholder="Ex: 20632"
              value={data.codigo}
              onChange={(e) => updateData('codigo', e.target.value)}
              maxLength={5}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="tipo-contrato">Tipo de Contrato *</Label>
          <Select value={data.tipoContrato} onValueChange={(value) => updateData('tipoContrato', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Efetivo">Efetivo</SelectItem>
              <SelectItem value="Temporário">Temporário</SelectItem>
              <SelectItem value="PJ">PJ</SelectItem>
              <SelectItem value="Estágio">Estágio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="requisitos">
            {data.tipoContrato === 'Temporário' ? 'Requisitos' : 'Requisitos e Atividades'} *
          </Label>
          <Textarea
            id="requisitos"
            placeholder="• Ensino Médio completo;&#10;• Experiência anterior na função/área;&#10;• Disponibilidade para trabalhar em turnos;"
            value={data.requisitos}
            onChange={(e) => updateData('requisitos', e.target.value)}
            maxLength={180}
            rows={4}
            className="mt-1 resize-none"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {data.requisitos.length}/180 caracteres
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Opções de Contato</Label>
        
        {/* Opções de contato */}
        <div className="space-y-4">
          {/* Website (padrão) */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="website"
              checked={data.contato.tipo === 'site'}
              onCheckedChange={(checked) => {
                console.log('Website checkbox clicked:', checked);
                if (checked) {
                  handleContactTypeChange('site');
                }
              }}
            />
            <label 
              htmlFor="website" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              onClick={() => handleContactTypeChange('site')}
            >
              Website da empresa
            </label>
          </div>
          {data.contato.tipo === 'site' && (
            <div className="ml-6 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-nt-light" />
                <span>novotemporh.com.br</span>
              </div>
            </div>
          )}

          {/* WhatsApp */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="whatsapp"
              checked={data.contato.tipo === 'whatsapp'}
              onCheckedChange={(checked) => {
                console.log('WhatsApp checkbox clicked:', checked);
                if (checked) {
                  handleContactTypeChange('whatsapp');
                }
              }}
            />
            <label 
              htmlFor="whatsapp" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              onClick={() => handleContactTypeChange('whatsapp')}
            >
              WhatsApp
            </label>
          </div>
          {data.contato.tipo === 'whatsapp' && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="whatsapp-number" className="text-sm">Número do WhatsApp</Label>
              <Input
                id="whatsapp-number"
                placeholder="(11) 99999-9999"
                value={data.contato.valor}
                onChange={(e) => handleWhatsAppChange(e.target.value)}
                maxLength={15}
                className="font-mono"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="w-4 h-4 text-nt-light" />
                <span>Formato: (xx) xxxxx-xxxx</span>
              </div>
            </div>
          )}

          {/* Email */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="email"
              checked={data.contato.tipo === 'email'}
              onCheckedChange={(checked) => {
                console.log('Email checkbox clicked:', checked);
                if (checked) {
                  handleContactTypeChange('email');
                }
              }}
            />
            <label 
              htmlFor="email" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              onClick={() => handleContactTypeChange('email')}
            >
              Email da empresa
            </label>
          </div>
          {data.contato.tipo === 'email' && (
            <div className="ml-6 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-nt-light" />
                <span>email@novotemporh.com.br</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};