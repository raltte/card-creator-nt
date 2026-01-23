import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Briefcase, MapPin, MessageSquare, ListChecks, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface RecrutadoraData {
  nomeVaga: string;
  codigoPS: string;
  tipoContrato: string;
  cidade: string;
  estado: string;
  captacaoCurriculo: 'whatsapp' | 'email' | 'site';
  whatsappNumber?: string;
  emailCaptacao?: string;
  requisitos: string[];
  setorAtuacao: string;
  sugestaoImagem?: string;
  isPcd?: boolean;
}

interface RecrutadoraFormProps {
  onSubmit: (data: RecrutadoraData) => void;
  data?: RecrutadoraData;
  onChange?: (data: RecrutadoraData) => void;
}

export const RecrutadoraForm = ({ onSubmit, data: externalData, onChange }: RecrutadoraFormProps) => {
  const { toast } = useToast();
  
  // Use external data if provided, otherwise use internal state
  const isControlled = externalData !== undefined && onChange !== undefined;
  
  const [internalFormData, setInternalFormData] = useState<RecrutadoraData>({
    nomeVaga: "",
    codigoPS: "",
    tipoContrato: "",
    cidade: "",
    estado: "",
    captacaoCurriculo: 'site',
    whatsappNumber: "",
    emailCaptacao: "email@novotemporh.com.br",
    requisitos: [],
    setorAtuacao: "",
    sugestaoImagem: "",
    isPcd: false
  });

  const formData = isControlled ? externalData : internalFormData;

  const [novoRequisito, setNovoRequisito] = useState("");

  const updateFormData = (field: keyof RecrutadoraData, value: any) => {
    const newData = {
      ...formData,
      [field]: value
    };
    
    if (isControlled && onChange) {
      onChange(newData);
    } else {
      setInternalFormData(newData);
    }
  };


  const adicionarRequisito = () => {
    if (novoRequisito.trim() && formData.requisitos.length < 4) {
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
        !formData.cidade || !formData.estado || !formData.setorAtuacao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de enviar.",
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
    <div className="space-y-8">
      {/* Seção: Informações da Vaga */}
      <div className="form-section">
        <div className="form-section-title">
          <Briefcase className="w-4 h-4" />
          Informações da Vaga
        </div>
        
        <div className="space-y-4">
          {/* Nome da Vaga */}
          <div>
            <Label htmlFor="nome-vaga" className="text-sm font-medium">Nome da Vaga *</Label>
            <Input
              id="nome-vaga"
              placeholder="Exemplo: Auxiliar de Produção"
              value={formData.nomeVaga}
              onChange={(e) => updateFormData('nomeVaga', e.target.value)}
              className="mt-1.5 h-11"
            />
          </div>

          {/* Código PS e Tipo de Contrato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="codigo-ps" className="text-sm font-medium">Código PS *</Label>
              <Input
                id="codigo-ps"
                placeholder="Ex: 20632"
                value={formData.codigoPS}
                onChange={(e) => updateFormData('codigoPS', e.target.value)}
                maxLength={5}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="tipo-contrato" className="text-sm font-medium">Tipo de Contrato *</Label>
              <Select value={formData.tipoContrato} onValueChange={(value) => updateFormData('tipoContrato', value)}>
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efetivo">Efetivo</SelectItem>
                  <SelectItem value="Temporário">Temporário</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                  <SelectItem value="Estágio">Estágio</SelectItem>
                  <SelectItem value="Terceirizado">Terceirizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Setor de Atuação */}
          <div>
            <Label htmlFor="setor-atuacao" className="text-sm font-medium">Setor de Atuação *</Label>
            <Select value={formData.setorAtuacao} onValueChange={(value) => updateFormData('setorAtuacao', value)}>
              <SelectTrigger className="mt-1.5 h-11">
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Administração">Administração</SelectItem>
                <SelectItem value="Atendimento ao Cliente">Atendimento ao Cliente</SelectItem>
                <SelectItem value="Educação">Educação</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Indústria">Indústria</SelectItem>
                <SelectItem value="Limpeza">Limpeza</SelectItem>
                <SelectItem value="Logística">Logística</SelectItem>
                <SelectItem value="Manutenção">Manutenção</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Produção">Produção</SelectItem>
                <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                <SelectItem value="Saúde">Saúde</SelectItem>
                <SelectItem value="Segurança">Segurança</SelectItem>
                <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                <SelectItem value="Vendas">Vendas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Seção: Localização */}
      <div className="form-section">
        <div className="form-section-title">
          <MapPin className="w-4 h-4" />
          Localização
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="cidade" className="text-sm font-medium">Cidade *</Label>
            <Input
              id="cidade"
              placeholder="Ex: São Paulo"
              value={formData.cidade}
              onChange={(e) => updateFormData('cidade', e.target.value)}
              className="mt-1.5 h-11"
            />
          </div>
          <div>
            <Label htmlFor="estado" className="text-sm font-medium">Estado *</Label>
            <Input
              id="estado"
              placeholder="SP"
              value={formData.estado}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                if (value.length <= 2) {
                  updateFormData('estado', value);
                }
              }}
              maxLength={2}
              className="mt-1.5 h-11 uppercase text-center font-semibold"
            />
          </div>
        </div>

        {/* Vaga PCD */}
        <div className="flex items-center justify-between p-4 bg-accent/30 border border-accent/50 rounded-xl mt-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-semibold">Vaga exclusiva PCD</Label>
            <p className="text-xs text-muted-foreground">
              Marque se esta vaga é destinada a Pessoas com Deficiência
            </p>
          </div>
          <Switch
            checked={formData.isPcd}
            onCheckedChange={(checked) => updateFormData('isPcd', checked)}
          />
        </div>
      </div>

      {/* Seção: Contato */}
      <div className="form-section">
        <div className="form-section-title">
          <MessageSquare className="w-4 h-4" />
          Forma de Contato
        </div>
        
        <div className="space-y-3">
          <div 
            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
              formData.captacaoCurriculo === 'site' 
                ? 'border-secondary bg-secondary/5' 
                : 'border-border hover:border-secondary/50'
            }`}
            onClick={() => updateFormData('captacaoCurriculo', 'site')}
          >
            <Checkbox 
              id="site-captacao"
              checked={formData.captacaoCurriculo === 'site'}
              onCheckedChange={(checked) => {
                if (checked) updateFormData('captacaoCurriculo', 'site');
              }}
            />
            <label htmlFor="site-captacao" className="text-sm font-medium cursor-pointer flex-1">
              Site (novotemporh.com.br)
            </label>
          </div>

          <div 
            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
              formData.captacaoCurriculo === 'whatsapp' 
                ? 'border-secondary bg-secondary/5' 
                : 'border-border hover:border-secondary/50'
            }`}
            onClick={() => updateFormData('captacaoCurriculo', 'whatsapp')}
          >
            <Checkbox 
              id="whatsapp-captacao"
              checked={formData.captacaoCurriculo === 'whatsapp'}
              onCheckedChange={(checked) => {
                if (checked) updateFormData('captacaoCurriculo', 'whatsapp');
              }}
            />
            <label htmlFor="whatsapp-captacao" className="text-sm font-medium cursor-pointer flex-1">
              WhatsApp
            </label>
          </div>
          {formData.captacaoCurriculo === 'whatsapp' && (
            <div className="ml-8">
              <Input
                placeholder="(xx) xxxxx-xxxx"
                value={formData.whatsappNumber || ""}
                onChange={(e) => handleWhatsAppChange(e.target.value)}
                maxLength={15}
                className="font-mono h-11"
              />
            </div>
          )}

          <div 
            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
              formData.captacaoCurriculo === 'email' 
                ? 'border-secondary bg-secondary/5' 
                : 'border-border hover:border-secondary/50'
            }`}
            onClick={() => updateFormData('captacaoCurriculo', 'email')}
          >
            <Checkbox 
              id="email-captacao"
              checked={formData.captacaoCurriculo === 'email'}
              onCheckedChange={(checked) => {
                if (checked) updateFormData('captacaoCurriculo', 'email');
              }}
            />
            <label htmlFor="email-captacao" className="text-sm font-medium cursor-pointer flex-1">
              E-mail
            </label>
          </div>
          {formData.captacaoCurriculo === 'email' && (
            <div className="ml-8">
              <Input
                placeholder="email@novotemporh.com.br"
                value={formData.emailCaptacao || ""}
                onChange={(e) => updateFormData('emailCaptacao', e.target.value)}
                type="email"
                className="h-11"
              />
            </div>
          )}
        </div>
      </div>

      {/* Seção: Requisitos */}
      <div className="form-section">
        <div className="form-section-title">
          <ListChecks className="w-4 h-4" />
          Requisitos e Atividades
        </div>
        
        <p className="text-xs text-muted-foreground mb-3">
          Adicione até 4 tópicos curtos que aparecerão no cartaz
        </p>
        
        <div className="space-y-2">
          {formData.requisitos.map((requisito, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-semibold text-secondary">
                {index + 1}
              </span>
              <span className="flex-1 text-sm">{requisito}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removerRequisito(index)}
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          {formData.requisitos.length < 4 && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar requisito..."
                  value={novoRequisito}
                  onChange={(e) => setNovoRequisito(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && adicionarRequisito()}
                  maxLength={60}
                  className="h-11"
                />
                <Button
                  variant="secondary"
                  onClick={adicionarRequisito}
                  disabled={!novoRequisito.trim()}
                  className="h-11 px-4"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {60 - novoRequisito.length} caracteres restantes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Seção: Imagem */}
      <div className="form-section">
        <div className="form-section-title">
          <ImageIcon className="w-4 h-4" />
          Sugestão de Imagem
          <span className="text-xs font-normal text-muted-foreground ml-auto">(opcional)</span>
        </div>
        
        <Textarea
          id="sugestao-imagem"
          placeholder="Descreva a imagem que gostaria de ver no cartaz. Ex: Pessoa trabalhando em um escritório moderno, ambiente industrial com máquinas, etc."
          value={formData.sugestaoImagem || ""}
          onChange={(e) => updateFormData('sugestaoImagem', e.target.value)}
          maxLength={200}
          rows={3}
          className="resize-none"
        />
        <div className="text-xs text-muted-foreground mt-2">
          {(formData.sugestaoImagem || "").length}/200 caracteres • Será usada ao gerar imagem com IA
        </div>
      </div>
    </div>
  );
};