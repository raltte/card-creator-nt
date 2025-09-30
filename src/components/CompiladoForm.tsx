import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Upload, Plus, Trash2, Globe, MessageCircle, Mail } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
  clientTemplate: 'padrao' | 'marisa';
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
      updateData('image', file);
    }
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
        
        <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-nt-light transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload-compilado"
          />
          <label htmlFor="image-upload-compilado" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2 text-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                Clique para fazer upload de uma imagem
              </div>
            </div>
          </label>
        </div>
      </div>

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