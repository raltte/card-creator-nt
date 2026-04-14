import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Globe, MessageCircle, Mail, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageFraming } from "./ImageFraming";

export interface MutiraoData {
  image?: File | string;
  tipoMutirao: string; // "Entrevistas" | "Curriculos" | custom
  cargo: string;
  tipoContrato: string;
  detalhes: string; // free text for schedule, benefits, etc.
  localEntrega: string; // full address
  dataPrazo: string; // e.g. "até o dia 17/04" or "no dia 20/05"
  mensagemExtra: string; // extra message at bottom
  contato: {
    tipo: 'whatsapp' | 'email' | 'site';
    valor: string;
  };
}

interface MutiraoFormProps {
  data: MutiraoData;
  onChange: (data: MutiraoData) => void;
}

export const MutiraoForm = ({ data, onChange }: MutiraoFormProps) => {
  const { toast } = useToast();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showFraming, setShowFraming] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  const updateData = (field: string, value: any) => {
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
      toast({ title: "Campo obrigatório", description: "Preencha o cargo antes de gerar a imagem.", variant: "destructive" });
      return;
    }
    setIsGeneratingImage(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-job-images', {
        body: { jobTitle: data.cargo, sector: "Geral", contractType: data.tipoContrato, requirements: [], clientTemplate: 'padrao' }
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
      toast({ title: "Erro", description: "Falha ao gerar imagem. Tente novamente.", variant: "destructive" });
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
    updateData('contato.tipo', tipo);
    switch (tipo) {
      case 'site': updateData('contato.valor', 'novotemporh.com.br'); break;
      case 'whatsapp': updateData('contato.valor', ''); break;
      case 'email': updateData('contato.valor', 'email@novotemporh.com.br'); break;
    }
  };

  const formatWhatsAppNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  if (showFraming && tempImageUrl) {
    return (
      <ImageFraming
        imageUrl={tempImageUrl}
        onFramingComplete={handleFramingComplete}
        onBack={handleBackFromFraming}
        modelType="tradicional-nt"
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Imagem */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Imagem Ilustrativa</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="border-2 border-dashed border-border rounded-lg p-3 hover:border-nt-light transition-colors">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="mutirao-image-upload" />
            <label htmlFor="mutirao-image-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-1 text-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Upload</div>
              </div>
            </label>
          </div>
          <Button type="button" variant="outline" onClick={handleGenerateAIImage} disabled={isGeneratingImage || !data.cargo} className="h-full">
            <div className="flex flex-col items-center gap-1">
              <Wand2 className="w-5 h-5" />
              <div className="text-xs">{isGeneratingImage ? 'Gerando...' : 'Gerar com IA'}</div>
            </div>
          </Button>
        </div>
        {data.image && (
          <div className="relative aspect-[9/16] max-h-32 rounded-lg overflow-hidden border-2 border-nt-light">
            <img src={typeof data.image === 'string' ? data.image : URL.createObjectURL(data.image)} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Tipo do Mutirão */}
      <div>
        <Label htmlFor="tipo-mutirao" className="text-sm">Tipo do Mutirão *</Label>
        <Select value={data.tipoMutirao} onValueChange={(value) => updateData('tipoMutirao', value)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Entrevistas">Mutirão de Entrevistas</SelectItem>
            <SelectItem value="Curriculos">Entrega de Currículos</SelectItem>
            <SelectItem value="Personalizado">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.tipoMutirao === 'Personalizado' && (
        <div>
          <Label htmlFor="titulo-custom" className="text-sm">Título personalizado</Label>
          <Input
            id="titulo-custom"
            placeholder="Ex: Processo Seletivo Especial"
            value={data.mensagemExtra}
            onChange={(e) => updateData('mensagemExtra', e.target.value)}
            className="mt-1"
          />
        </div>
      )}

      {/* Cargo e Contrato */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <Label htmlFor="cargo-mutirao" className="text-sm">Cargo da Vaga *</Label>
          <Input id="cargo-mutirao" placeholder="Ex: Operador de Produção" value={data.cargo} onChange={(e) => updateData('cargo', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="contrato-mutirao" className="text-sm">Tipo de Contrato *</Label>
          <Select value={data.tipoContrato} onValueChange={(value) => updateData('tipoContrato', value)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Efetivo">Efetivo</SelectItem>
              <SelectItem value="Temporário">Temporário</SelectItem>
              <SelectItem value="PJ">PJ</SelectItem>
              <SelectItem value="Estágio">Estágio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Detalhes */}
      <div>
        <Label htmlFor="detalhes-mutirao" className="text-sm">Detalhes (horários, benefícios, etc.)</Label>
        <Textarea
          id="detalhes-mutirao"
          placeholder="Segunda a Sábado&#10;Turno A: 06h00 às 14h00&#10;Benefícios: Vale Transporte e refeição no local."
          value={data.detalhes}
          onChange={(e) => updateData('detalhes', e.target.value)}
          rows={5}
          className="mt-1 resize-none text-sm"
        />
      </div>

      {/* Local e Data */}
      <div>
        <Label htmlFor="local-entrega" className="text-sm">Local / Endereço *</Label>
        <Textarea
          id="local-entrega"
          placeholder="Av. Pref. Alberto Moura, 6300 - Distrito Industrial, Sete Lagoas - MG"
          value={data.localEntrega}
          onChange={(e) => updateData('localEntrega', e.target.value)}
          rows={2}
          className="mt-1 resize-none text-sm"
        />
      </div>

      <div>
        <Label htmlFor="data-prazo" className="text-sm">Data / Prazo *</Label>
        <Input
          id="data-prazo"
          placeholder="Ex: até o dia 17/04 ou no dia 20/05 às 09h30"
          value={data.dataPrazo}
          onChange={(e) => updateData('dataPrazo', e.target.value)}
          className="mt-1"
        />
      </div>

      {/* Mensagem Extra */}
      {data.tipoMutirao !== 'Personalizado' && (
        <div>
          <Label htmlFor="mensagem-extra" className="text-sm">Mensagem adicional (opcional)</Label>
          <Textarea
            id="mensagem-extra"
            placeholder="Ex: Caso já tenha realizado entrega do currículo, gentilmente aguardar contato"
            value={data.mensagemExtra}
            onChange={(e) => updateData('mensagemExtra', e.target.value)}
            rows={2}
            className="mt-1 resize-none text-sm"
          />
        </div>
      )}

      {/* Contato */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Contato</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="mutirao-website" checked={data.contato.tipo === 'site'} onCheckedChange={(checked) => { if (checked) handleContactTypeChange('site'); }} />
            <label htmlFor="mutirao-website" className="text-sm cursor-pointer">Website</label>
          </div>
          {data.contato.tipo === 'site' && (
            <div className="ml-6 p-2 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-xs"><Globe className="w-3 h-3 text-nt-light" /><span>novotemporh.com.br</span></div>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox id="mutirao-whatsapp" checked={data.contato.tipo === 'whatsapp'} onCheckedChange={(checked) => { if (checked) handleContactTypeChange('whatsapp'); }} />
            <label htmlFor="mutirao-whatsapp" className="text-sm cursor-pointer">WhatsApp</label>
          </div>
          {data.contato.tipo === 'whatsapp' && (
            <div className="ml-6">
              <Input placeholder="(11) 99999-9999" value={data.contato.valor} onChange={(e) => updateData('contato.valor', formatWhatsAppNumber(e.target.value))} maxLength={15} className="font-mono text-sm" />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox id="mutirao-email" checked={data.contato.tipo === 'email'} onCheckedChange={(checked) => { if (checked) handleContactTypeChange('email'); }} />
            <label htmlFor="mutirao-email" className="text-sm cursor-pointer">Email</label>
          </div>
          {data.contato.tipo === 'email' && (
            <div className="ml-6">
              <Input placeholder="email@novotemporh.com.br" value={data.contato.valor} onChange={(e) => updateData('contato.valor', e.target.value)} className="text-sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
