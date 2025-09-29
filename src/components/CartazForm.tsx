import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Globe, MessageCircle, Mail } from "lucide-react";
import { CartazData } from "./CartazGenerator";

interface CartazFormProps {
  data: CartazData;
  onChange: (data: CartazData) => void;
}

export const CartazForm = ({ data, onChange }: CartazFormProps) => {
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
                if (checked) {
                  updateData('contato.tipo', 'site');
                  updateData('contato.valor', 'novotemporh.com.br');
                }
              }}
            />
            <label htmlFor="website" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
                if (checked) {
                  updateData('contato.tipo', 'whatsapp');
                  updateData('contato.valor', '');
                }
              }}
            />
            <label htmlFor="whatsapp" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
                if (checked) {
                  updateData('contato.tipo', 'email');
                  updateData('contato.valor', 'email@novotemporh.com.br');
                }
              }}
            />
            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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