import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Globe } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export interface CompiladoVaga {
  codigo: string;
  cargo: string;
}

export interface CompiladoData {
  image?: File | string;
  cidade: string;
  estado: string;
  vagas: CompiladoVaga[];
  requisitos: string;
  isPcd: boolean;
  clientTemplate: 'padrao' | 'marisa' | 'weg';
  contato: {
    tipo: 'whatsapp' | 'email' | 'site';
    valor: string;
  };
  // Computed field for backward compatibility
  get local(): string;
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
    let valor = '';
    switch (tipo) {
      case 'site':
        valor = data.clientTemplate === 'marisa' ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br';
        break;
      case 'whatsapp':
        valor = '';
        break;
      case 'email':
        valor = 'email@novotemporh.com.br';
        break;
    }
    
    onChange({
      ...data,
      contato: { tipo, valor }
    });
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
    <div className="space-y-5">
      {/* Seleção de Template */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Template do Cliente</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => updateData('clientTemplate', 'padrao')}
            className={`p-3 border-2 rounded-lg text-center transition-colors ${
              data.clientTemplate === 'padrao' 
                ? 'border-nt-light bg-nt-light/10' 
                : 'border-border hover:border-nt-light/50'
            }`}
          >
            <div className="font-semibold text-sm">Novo Tempo</div>
          </button>
          <button
            type="button"
            onClick={() => updateData('clientTemplate', 'marisa')}
            className={`p-3 border-2 rounded-lg text-center transition-colors ${
              data.clientTemplate === 'marisa' 
                ? 'border-pink-500 bg-pink-500/10' 
                : 'border-border hover:border-pink-500/50'
            }`}
          >
            <div className="font-semibold text-sm">Marisa</div>
          </button>
        </div>
      </div>

      {/* Vaga PCD */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="pcd-compilado" className="text-sm font-semibold">Vaga PCD</Label>
          <div className="text-xs text-muted-foreground">
            Exclusiva para PcD
          </div>
        </div>
        <Switch
          id="pcd-compilado"
          checked={data.isPcd}
          onCheckedChange={(checked) => updateData('isPcd', checked)}
        />
      </div>

      {/* Local */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Label htmlFor="cidade" className="text-sm">Cidade *</Label>
          <Input
            id="cidade"
            placeholder="Ex: Arujá"
            value={data.cidade}
            onChange={(e) => updateData('cidade', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="estado" className="text-sm">UF *</Label>
          <Input
            id="estado"
            placeholder="SP"
            value={data.estado}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (value.length <= 2) {
                updateData('estado', value);
              }
            }}
            maxLength={2}
            className="mt-1 uppercase"
          />
        </div>
      </div>

      {/* Vagas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Vagas</Label>
          <Button 
            type="button" 
            size="sm" 
            onClick={addVaga}
            variant="outline"
            className="h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Adicionar
          </Button>
        </div>

        {data.vagas.map((vaga, index) => (
          <div key={index} className="flex gap-2 items-center p-2 border rounded-lg">
            <Input
              placeholder="Código"
              value={vaga.codigo}
              onChange={(e) => updateVaga(index, 'codigo', e.target.value)}
              maxLength={5}
              className="w-20 text-sm"
            />
            <Input
              placeholder="Nome da vaga"
              value={vaga.cargo}
              onChange={(e) => updateVaga(index, 'cargo', e.target.value)}
              className="flex-1 text-sm"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => removeVaga(index)}
              disabled={data.vagas.length === 1}
              className="h-8 w-8"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {/* Requisitos e Atividades */}
      <div>
        <Label htmlFor="requisitos" className="text-sm">Requisitos e Atividades *</Label>
        <Textarea
          id="requisitos"
          placeholder="• Ensino Médio Completo;&#10;• Disponibilidade para turnos;&#10;• Experiência em atendimento."
          value={data.requisitos}
          onChange={(e) => updateData('requisitos', e.target.value)}
          maxLength={250}
          rows={3}
          className="mt-1 resize-none text-sm"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {data.requisitos.length}/250
        </div>
      </div>

      {/* Contato */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Contato</Label>
        
        <div className="space-y-3">
          {/* Website */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="website-compilado"
              checked={data.contato.tipo === 'site'}
              onCheckedChange={(checked) => {
                if (checked) handleContactTypeChange('site');
              }}
            />
            <label htmlFor="website-compilado" className="text-sm cursor-pointer">
              Website
            </label>
          </div>
          {data.contato.tipo === 'site' && (
            <div className="ml-6 p-2 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-xs">
                <Globe className="w-3 h-3 text-nt-light" />
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
            <label htmlFor="whatsapp-compilado" className="text-sm cursor-pointer">
              WhatsApp
            </label>
          </div>
          {data.contato.tipo === 'whatsapp' && (
            <div className="ml-6">
              <Input
                placeholder="(11) 99999-9999"
                value={data.contato.valor}
                onChange={(e) => handleWhatsAppChange(e.target.value)}
                maxLength={15}
                className="font-mono text-sm"
              />
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
            <label htmlFor="email-compilado" className="text-sm cursor-pointer">
              Email
            </label>
          </div>
          {data.contato.tipo === 'email' && (
            <div className="ml-6">
              <Input
                placeholder="email@novotemporh.com.br"
                value={data.contato.valor}
                onChange={(e) => updateData('contato.valor', e.target.value)}
                className="text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
