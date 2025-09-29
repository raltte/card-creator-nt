import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Upload, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface RecrutadoraData {
  nomeVaga: string;
  tipoCartaz: string;
  codigoPS: string;
  tipoContrato: string;
  cidadeEstado: string;
  captacaoCurriculo: 'whatsapp' | 'email' | 'presencial';
  whatsappNumber?: string;
  emailCaptacao?: string;
  descricaoVaga: string;
  requisitos: string[];
  setorAtuacao: string;
  linkPS: string;
  emailSolicitante: string;
  imagemVaga?: File;
}

interface RecrutadoraFormProps {
  onSubmit: (data: RecrutadoraData) => void;
}

export const RecrutadoraForm = ({ onSubmit }: RecrutadoraFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<RecrutadoraData>({
    nomeVaga: "",
    tipoCartaz: "",
    codigoPS: "",
    tipoContrato: "",
    cidadeEstado: "",
    captacaoCurriculo: 'whatsapp',
    whatsappNumber: "",
    emailCaptacao: "email@novotemporh.com.br",
    descricaoVaga: "",
    requisitos: [],
    setorAtuacao: "",
    linkPS: "",
    emailSolicitante: ""
  });

  const [novoRequisito, setNovoRequisito] = useState("");

  const updateFormData = (field: keyof RecrutadoraData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateFormData('imagemVaga', file);
    }
  };

  const adicionarRequisito = () => {
    if (novoRequisito.trim() && formData.requisitos.length < 3) {
      updateFormData('requisitos', [...formData.requisitos, novoRequisito.trim()]);
      setNovoRequisito("");
    }
  };

  const removerRequisito = (index: number) => {
    updateFormData('requisitos', formData.requisitos.filter((_, i) => i !== index));
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
    updateFormData('whatsappNumber', formatted);
  };

  const handleSubmit = () => {
    // Validação básica
    if (!formData.nomeVaga || !formData.codigoPS || !formData.tipoContrato || 
        !formData.cidadeEstado || !formData.descricaoVaga || !formData.emailSolicitante) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    if (formData.descricaoVaga.length < 200 || formData.descricaoVaga.length > 300) {
      toast({
        title: "Descrição inválida",
        description: "A descrição deve ter entre 200 e 300 caracteres.",
        variant: "destructive"
      });
      return;
    }

    if (formData.requisitos.length === 0) {
      toast({
        title: "Requisitos necessários",
        description: "Adicione pelo menos um requisito.",
        variant: "destructive"
      });
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      {/* Nome da Vaga */}
      <div>
        <Label htmlFor="nome-vaga">Nome da Vaga *</Label>
        <Input
          id="nome-vaga"
          placeholder="Exemplo: Auxiliar de Produção"
          value={formData.nomeVaga}
          onChange={(e) => updateFormData('nomeVaga', e.target.value)}
          className="mt-1"
        />
      </div>

      {/* Tipo de Cartaz */}
      <div>
        <Label htmlFor="tipo-cartaz">Tipo de Cartaz</Label>
        <Select value={formData.tipoCartaz} onValueChange={(value) => updateFormData('tipoCartaz', value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="padrao">Padrão</SelectItem>
            <SelectItem value="destaque">Destaque</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Código PS e Tipo de Contrato */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="codigo-ps">Código PS *</Label>
          <Input
            id="codigo-ps"
            placeholder="Ex: 20632"
            value={formData.codigoPS}
            onChange={(e) => updateFormData('codigoPS', e.target.value)}
            maxLength={5}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="tipo-contrato">Tipo de Contrato *</Label>
          <Select value={formData.tipoContrato} onValueChange={(value) => updateFormData('tipoContrato', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Efetivo">Efetivo</SelectItem>
              <SelectItem value="Temporário">Temporário</SelectItem>
              <SelectItem value="PJ">PJ</SelectItem>
              <SelectItem value="Estágio">Estágio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cidade/Estado */}
      <div>
        <Label htmlFor="cidade-estado">Cidade/Estado *</Label>
        <Input
          id="cidade-estado"
          placeholder="Ex: Resende - RJ"
          value={formData.cidadeEstado}
          onChange={(e) => updateFormData('cidadeEstado', e.target.value)}
          className="mt-1"
        />
      </div>

      {/* Captação de Currículo */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Captação de Currículo *</Label>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="whatsapp-captacao"
              checked={formData.captacaoCurriculo === 'whatsapp'}
              onCheckedChange={(checked) => {
                if (checked) updateFormData('captacaoCurriculo', 'whatsapp');
              }}
            />
            <label htmlFor="whatsapp-captacao" className="text-sm font-medium cursor-pointer">
              Por WhatsApp
            </label>
          </div>
          {formData.captacaoCurriculo === 'whatsapp' && (
            <div className="ml-6">
              <Input
                placeholder="(11) 99999-9999"
                value={formData.whatsappNumber || ""}
                onChange={(e) => handleWhatsAppChange(e.target.value)}
                maxLength={15}
                className="font-mono"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="email-captacao"
              checked={formData.captacaoCurriculo === 'email'}
              onCheckedChange={(checked) => {
                if (checked) updateFormData('captacaoCurriculo', 'email');
              }}
            />
            <label htmlFor="email-captacao" className="text-sm font-medium cursor-pointer">
              Por E-mail
            </label>
          </div>
          {formData.captacaoCurriculo === 'email' && (
            <div className="ml-6">
              <Input
                placeholder="email@novotemporh.com.br"
                value={formData.emailCaptacao || ""}
                onChange={(e) => updateFormData('emailCaptacao', e.target.value)}
                type="email"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="presencial-captacao"
              checked={formData.captacaoCurriculo === 'presencial'}
              onCheckedChange={(checked) => {
                if (checked) updateFormData('captacaoCurriculo', 'presencial');
              }}
            />
            <label htmlFor="presencial-captacao" className="text-sm font-medium cursor-pointer">
              Presencial
            </label>
          </div>
        </div>
      </div>

      {/* Descrição da Vaga */}
      <div>
        <Label htmlFor="descricao-vaga">Descrição da Vaga *</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Fale brevemente sobre a vaga e suas principais responsabilidades (200 a 300 caracteres)
        </p>
        <Textarea
          id="descricao-vaga"
          placeholder="Descreva brevemente a vaga e suas principais responsabilidades..."
          value={formData.descricaoVaga}
          onChange={(e) => updateFormData('descricaoVaga', e.target.value)}
          minLength={200}
          maxLength={300}
          rows={4}
          className="mt-1 resize-none"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {formData.descricaoVaga.length}/300 caracteres
        </div>
      </div>

      {/* Requisitos */}
      <div>
        <Label className="text-base font-semibold">Requisitos * (máximo 3)</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Selecione no máximo três tópicos essenciais (curtos)
        </p>
        
        <div className="space-y-2">
          {formData.requisitos.map((requisito, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
              <span className="flex-1 text-sm">{requisito}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removerRequisito(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          {formData.requisitos.length < 3 && (
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar requisito..."
                value={novoRequisito}
                onChange={(e) => setNovoRequisito(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && adicionarRequisito()}
              />
              <Button
                variant="outline"
                onClick={adicionarRequisito}
                disabled={!novoRequisito.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Setor de Atuação */}
      <div>
        <Label htmlFor="setor-atuacao">Setor de Atuação</Label>
        <Select value={formData.setorAtuacao} onValueChange={(value) => updateFormData('setorAtuacao', value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Selecione o setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="industria">Indústria</SelectItem>
            <SelectItem value="comercio">Comércio</SelectItem>
            <SelectItem value="servicos">Serviços</SelectItem>
            <SelectItem value="saude">Saúde</SelectItem>
            <SelectItem value="educacao">Educação</SelectItem>
            <SelectItem value="tecnologia">Tecnologia</SelectItem>
            <SelectItem value="financeiro">Financeiro</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Imagem da Vaga */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Imagem da Vaga (opcional)</Label>
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

      {/* Link da PS */}
      <div>
        <Label htmlFor="link-ps">Link da PS</Label>
        <Input
          id="link-ps"
          placeholder="https://..."
          value={formData.linkPS}
          onChange={(e) => updateFormData('linkPS', e.target.value)}
          type="url"
          className="mt-1"
        />
      </div>

      {/* E-mail do Solicitante */}
      <div>
        <Label htmlFor="email-solicitante">E-mail do Solicitante *</Label>
        <Input
          id="email-solicitante"
          placeholder="seu.email@novotemporh.com.br"
          value={formData.emailSolicitante}
          onChange={(e) => updateFormData('emailSolicitante', e.target.value)}
          type="email"
          className="mt-1"
        />
      </div>

      {/* Botão de Envio */}
      <Button 
        onClick={handleSubmit}
        className="w-full"
        size="lg"
      >
        Gerar Cartaz
      </Button>
    </div>
  );
};