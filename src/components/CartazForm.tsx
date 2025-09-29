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
            maxLength={256}
            rows={4}
            className="mt-1 resize-none"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {data.requisitos.length}/256 caracteres
          </div>
        </div>
      </div>

      {/* Contato */}
      <Card>
        <CardContent className="p-4">
          <Label className="text-base font-semibold mb-4 block">
            Contato para Envio de Currículo
          </Label>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="contato-tipo">Tipo de Contato</Label>
              <Select 
                value={data.contato.tipo} 
                onValueChange={(value: 'whatsapp' | 'email' | 'site') => updateData('contato.tipo', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="site">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Site
                    </div>
                  </SelectItem>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      WhatsApp
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      E-mail
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="contato-valor">
                {data.contato.tipo === 'whatsapp' && 'Número do WhatsApp'}
                {data.contato.tipo === 'email' && 'Endereço de E-mail'}
                {data.contato.tipo === 'site' && 'URL do Site'}
              </Label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {getContactIcon(data.contato.tipo)}
                </div>
                <Input
                  id="contato-valor"
                  placeholder={
                    data.contato.tipo === 'whatsapp' ? '(11) 94449-6131' :
                    data.contato.tipo === 'email' ? 'contato@novotemporh.com.br' :
                    'novotemporh.com.br'
                  }
                  value={data.contato.valor}
                  onChange={(e) => updateData('contato.valor', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};