import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Upload, Plus, Trash2, Globe, MessageCircle, Mail, Wand2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageFraming } from "./ImageFraming";

export interface CompiladoVaga {
  codigo: string;
  cargo: string;
}

export interface CompiladoData {
  image?: File | string;
  local: string;
  vagas: CompiladoVaga[];
  requisitos: string;
  isPcd: boolean;
  clientTemplate: 'padrao' | 'marisa' | 'weg';
  contato: {
    tipo: 'whatsapp' | 'email' | 'site';
    valor: string;
  };
}

interface CompiladoFormProps {
  data: CompiladoData;
  onChange: (data: CompiladoData) => void;
}

export const CompiladoForm = ({ data, onChange }: CompiladoFormProps) => {
  const { toast } = useToast();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showFraming, setShowFraming] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  const updateData = (field: keyof CompiladoData | string, value: any) => {
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
    if (data.vagas.length === 0 || !data.vagas[0].cargo) {
      toast({
        title: "Campo obrigatório",
        description: "Adicione pelo menos uma vaga antes de gerar a imagem.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-job-images', {
        body: {
          jobTitle: data.vagas[0].cargo,
          sector: "Geral",
          contractType: "Diversos",
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

  const addVaga = () => {
    const newVagas = [...data.vagas, { codigo: '', cargo: '' }];
    updateData('vagas', newVagas);
  };

  const removeVaga = (index: number) => {
    const newVagas = data.vagas.filter((_, i) => i !== index);
    updateData('vagas', newVagas);
  };

  const updateVaga = (index: number, field: 'codigo' | 'cargo', value: string) => {
    const newVagas = [...data.vagas];
    newVagas[index] = { ...newVagas[index], [field]: value };
    updateData('vagas', newVagas);
  };

  const handleContactTypeChange = (tipo: 'site' | 'whatsapp' | 'email') => {
    updateData('contato.tipo', tipo);
    
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
    const numbers = value.replace(/\D/g, '');
    
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
        modelType="compilado"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Vaga PCD */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="pcd-compilado" className="text-base font-semibold">Vaga PCD</Label>
          <div className="text-sm text-muted-foreground">
            Vaga exclusiva ou afirmativa para Pessoa com Deficiência
          </div>
        </div>
        <Switch
          id="pcd-compilado"
          checked={data.isPcd}
          onCheckedChange={(checked) => updateData('isPcd', checked)}
        />
      </div>

      {/* Local */}
      <div>
        <Label htmlFor="local">Local *</Label>
        <Input
          id="local"
          placeholder="Ex: Arujá - SP"
          value={data.local}
          onChange={(e) => updateData('local', e.target.value)}
          className="mt-1"
        />
      </div>

      {/* Vagas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Vagas</Label>
          <Button 
            type="button" 
            size="sm" 
            onClick={addVaga}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Vaga
          </Button>
        </div>

        {data.vagas.map((vaga, index) => (
          <div key={index} className="flex gap-2 items-start p-4 border rounded-lg">
            <div className="flex-1 grid grid-cols-4 gap-2">
              <Input
                placeholder="Código"
                value={vaga.codigo}
                onChange={(e) => updateVaga(index, 'codigo', e.target.value)}
                maxLength={5}
              />
              <Input
                placeholder="Nome da vaga"
                value={vaga.cargo}
                onChange={(e) => updateVaga(index, 'cargo', e.target.value)}
                className="col-span-3"
              />
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => removeVaga(index)}
              disabled={data.vagas.length === 1}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {/* Requisitos */}
      <div>
        <Label htmlFor="requisitos">Requisitos *</Label>
        <Textarea
          id="requisitos"
          placeholder="• Ensino Médio Completo;&#10;• Disponibilidade para atuar em turnos."
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

      {/* Contato */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Opções de Contato</Label>
        
        <div className="space-y-4">
          {/* Website */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="website-compilado"
              checked={data.contato.tipo === 'site'}
              onCheckedChange={(checked) => {
                if (checked) handleContactTypeChange('site');
              }}
            />
            <label 
              htmlFor="website-compilado" 
              className="text-sm font-medium leading-none cursor-pointer"
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
              id="whatsapp-compilado"
              checked={data.contato.tipo === 'whatsapp'}
              onCheckedChange={(checked) => {
                if (checked) handleContactTypeChange('whatsapp');
              }}
            />
            <label 
              htmlFor="whatsapp-compilado" 
              className="text-sm font-medium leading-none cursor-pointer"
              onClick={() => handleContactTypeChange('whatsapp')}
            >
              WhatsApp
            </label>
          </div>
          {data.contato.tipo === 'whatsapp' && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="whatsapp-number-compilado" className="text-sm">Número do WhatsApp</Label>
              <Input
                id="whatsapp-number-compilado"
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
              id="email-compilado"
              checked={data.contato.tipo === 'email'}
              onCheckedChange={(checked) => {
                if (checked) handleContactTypeChange('email');
              }}
            />
            <label 
              htmlFor="email-compilado" 
              className="text-sm font-medium leading-none cursor-pointer"
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