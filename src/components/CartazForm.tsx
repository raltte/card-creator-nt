import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, User, Building, Phone, Mail, Globe } from "lucide-react";
import { CartazData } from "./CartazGenerator";

interface CartazFormProps {
  data: CartazData;
  onChange: (data: CartazData) => void;
}

const templateImages = [
  { id: 'admin', name: 'Administrativo', description: 'Pessoa em ambiente de escritório' },
  { id: 'industrial', name: 'Industrial', description: 'Pessoa com EPI/capacete' },
  { id: 'comercial', name: 'Comercial', description: 'Pessoa em ambiente comercial' },
  { id: 'operacional', name: 'Operacional', description: 'Pessoa em uniforme' },
  { id: 'estagio', name: 'Estágio', description: 'Estudante/jovem profissional' }
];

export const CartazForm = ({ data, onChange }: CartazFormProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const updateData = (field: keyof CartazData | string, value: any) => {
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
      setSelectedTemplate('');
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    updateData('image', templateId);
  };

  const getContactIcon = (tipo: string) => {
    switch (tipo) {
      case 'whatsapp': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'site': return <Globe className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Imagem */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Imagem Ilustrativa</Label>
        
        {/* Upload personalizado */}
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
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                Clique para fazer upload de uma imagem
              </div>
            </div>
          </label>
        </div>

        {/* Templates */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">
            Ou escolha um template:
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {templateImages.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate === template.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleTemplateSelect(template.id)}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <User className="w-4 h-4" />
                <span className="text-xs">{template.name}</span>
              </Button>
            ))}
          </div>
        </div>
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
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Contato (Fixo: novotemporh.com.br)
        </Label>
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span>novotemporh.com.br</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Website fixo da empresa
          </p>
        </div>
      </div>
    </div>
  );
};