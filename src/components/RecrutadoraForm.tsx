import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Upload, Plus, X } from "lucide-react";
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
  emailSolicitante: string;
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
    emailSolicitante: "",
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
    if (novoRequisito.trim() && formData.requisitos.length < 5) {
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
        !formData.cidade || !formData.estado || !formData.emailSolicitante || !formData.setorAtuacao) {
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

      {/* Código PS e Tipo de Contrato */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <SelectItem value="Terceirizado">Terceirizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Local da Vaga */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="cidade">Cidade *</Label>
          <Input
            id="cidade"
            placeholder="Ex: São Paulo"
            value={formData.cidade}
            onChange={(e) => updateFormData('cidade', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="estado">Estado * (Sigla)</Label>
          <Input
            id="estado"
            placeholder="Ex: SP"
            value={formData.estado}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (value.length <= 2) {
                updateFormData('estado', value);
              }
            }}
            maxLength={2}
            className="mt-1 uppercase"
          />
        </div>
      </div>

      {/* Vaga PCD */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label className="text-base font-semibold">Vaga PCD</Label>
          <p className="text-sm text-muted-foreground">
            Esta vaga é exclusiva para Pessoas com Deficiência?
          </p>
        </div>
        <Switch
          checked={formData.isPcd}
          onCheckedChange={(checked) => updateFormData('isPcd', checked)}
        />
      </div>

      {/* Como enviar currículo */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Como enviar currículo? *</Label>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="site-captacao"
              checked={formData.captacaoCurriculo === 'site'}
              onCheckedChange={(checked) => {
                if (checked) updateFormData('captacaoCurriculo', 'site');
              }}
            />
            <label htmlFor="site-captacao" className="text-sm font-medium cursor-pointer">
              Site (novotemporh.com.br)
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="whatsapp-captacao"
              checked={formData.captacaoCurriculo === 'whatsapp'}
              onCheckedChange={(checked) => {
                if (checked) updateFormData('captacaoCurriculo', 'whatsapp');
              }}
            />
            <label htmlFor="whatsapp-captacao" className="text-sm font-medium cursor-pointer">
              WhatsApp
            </label>
          </div>
          {formData.captacaoCurriculo === 'whatsapp' && (
            <div className="ml-6">
              <Input
                placeholder="(xx) xxxxx-xxxx"
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
              E-mail
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
        </div>
      </div>

      {/* Descrição será gerada automaticamente baseada nos requisitos */}

      {/* Requisitos e Atividades */}
      <div>
        <Label className="text-base font-semibold">Requisitos e Atividades * (máximo 5)</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Selecione no máximo cinco tópicos essenciais (curtos)
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
          
          {formData.requisitos.length < 5 && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar requisito..."
                  value={novoRequisito}
                  onChange={(e) => setNovoRequisito(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && adicionarRequisito()}
                  maxLength={60}
                />
                <Button
                  variant="outline"
                  onClick={adicionarRequisito}
                  disabled={!novoRequisito.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Máximo 60 caracteres por requisito para garantir que tudo fique visível no cartaz
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sugestão de Imagem */}
      <div>
        <Label htmlFor="sugestao-imagem">Sugestão de Imagem (opcional)</Label>
        <Textarea
          id="sugestao-imagem"
          placeholder="Descreva a imagem que gostaria de ver no cartaz. Ex: Pessoa trabalhando em um escritório moderno, ambiente industrial com máquinas, etc."
          value={formData.sugestaoImagem || ""}
          onChange={(e) => updateFormData('sugestaoImagem', e.target.value)}
          maxLength={200}
          rows={3}
          className="mt-1 resize-none"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {(formData.sugestaoImagem || "").length}/200 caracteres - Esta sugestão será usada ao gerar a imagem com IA
        </div>
      </div>

      {/* Setor de Atuação */}
      <div>
        <Label htmlFor="setor-atuacao">Setor de Atuação *</Label>
        <Select value={formData.setorAtuacao} onValueChange={(value) => updateFormData('setorAtuacao', value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Selecione o setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Administração">Administração</SelectItem>
            <SelectItem value="Produção">Produção</SelectItem>
            <SelectItem value="Vendas">Vendas</SelectItem>
            <SelectItem value="Tecnologia">Tecnologia</SelectItem>
            <SelectItem value="Saúde">Saúde</SelectItem>
            <SelectItem value="Educação">Educação</SelectItem>
            <SelectItem value="Financeiro">Financeiro</SelectItem>
            <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
            <SelectItem value="Logística">Logística</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Atendimento ao Cliente">Atendimento ao Cliente</SelectItem>
            <SelectItem value="Segurança">Segurança</SelectItem>
            <SelectItem value="Limpeza">Limpeza</SelectItem>
            <SelectItem value="Manutenção">Manutenção</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* A imagem será gerada automaticamente pela IA */}

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
    </div>
  );
};