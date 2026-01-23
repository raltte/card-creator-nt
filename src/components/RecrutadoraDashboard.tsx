import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecrutadoraForm, RecrutadoraData } from "./RecrutadoraForm";
import { CompiladoForm, CompiladoData } from "./CompiladoForm";
import { CartazPreview } from "./CartazPreview";
import { CartazPreviewMarisa } from "./CartazPreviewMarisa";
import { CartazPreviewWeg } from "./CartazPreviewWeg";
import { CartazPreviewVagaInterna } from "./CartazPreviewVagaInterna";
import { CartazPreviewDMCard } from "./CartazPreviewDMCard";
import { CompiladoPreview } from "./CompiladoPreview";
import { CompiladoPreviewMarisa } from "./CompiladoPreviewMarisa";
import { MondayItemSelector } from "./MondayItemSelector";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Send, Edit } from "lucide-react";

class CompiladoDataImpl implements CompiladoData {
  image: File | string = '';
  cidade = '';
  estado = '';
  vagas = [{ codigo: '', cargo: '' }];
  requisitos = '';
  isPcd = false;
  clientTemplate: 'padrao' | 'marisa' | 'weg' = 'padrao';
  contato: { tipo: 'whatsapp' | 'email' | 'site'; valor: string } = { tipo: 'site', valor: 'novotemporh.com.br' };
  
  get local(): string {
    return this.cidade && this.estado ? `${this.cidade} - ${this.estado}` : "";
  }
}

export const RecrutadoraDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const [tipoCartaz, setTipoCartaz] = useState<'individual' | 'compilado'>('individual');
  const [modeloSelecionado, setModeloSelecionado] = useState<'padrao' | 'marisa' | 'weg' | 'vaga-interna' | 'dm-card'>('padrao');
  const [dadosIndividual, setDadosIndividual] = useState<any>({
    nomeVaga: "",
    codigoPS: "",
    tipoContrato: "",
    cidadeEstado: "",
    captacaoCurriculo: 'site',
    whatsappNumber: "",
    emailCaptacao: "email@novotemporh.com.br",
    requisitos: [],
    setorAtuacao: "",
    image: '',
    sugestaoImagem: ''
  });
  const [dadosCompilado, setDadosCompilado] = useState<CompiladoDataImpl>(() => new CompiladoDataImpl());
  const [showMondaySelector, setShowMondaySelector] = useState(false);
  const [pendingFinalizacao, setPendingFinalizacao] = useState<{
    tipo: 'individual' | 'compilado';
    dados: any;
  } | null>(null);

  const { isEditor } = useAuth();

  // Validação centralizada para formulário individual
  const validateIndividualForm = (dados: RecrutadoraData): boolean => {
    if (!dados.nomeVaga?.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha o nome da vaga.", variant: "destructive" });
      return false;
    }
    if (!dados.codigoPS?.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha o código PS.", variant: "destructive" });
      return false;
    }
    if (!dados.tipoContrato?.trim()) {
      toast({ title: "Campo obrigatório", description: "Selecione o tipo de contrato.", variant: "destructive" });
      return false;
    }
    if (!dados.cidade?.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha a cidade.", variant: "destructive" });
      return false;
    }
    if (!dados.estado?.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha o estado.", variant: "destructive" });
      return false;
    }
    if (!dados.setorAtuacao?.trim()) {
      toast({ title: "Campo obrigatório", description: "Selecione o setor de atuação.", variant: "destructive" });
      return false;
    }
    if (!dados.requisitos || dados.requisitos.length === 0) {
      toast({ title: "Campo obrigatório", description: "Adicione pelo menos um requisito.", variant: "destructive" });
      return false;
    }
    // Validar contato de captação
    if (dados.captacaoCurriculo === 'whatsapp' && !dados.whatsappNumber?.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha o número de WhatsApp.", variant: "destructive" });
      return false;
    }
    if (dados.captacaoCurriculo === 'email' && !dados.emailCaptacao?.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha o e-mail de captação.", variant: "destructive" });
      return false;
    }
    return true;
  };

  // Validação para formulário compilado
  const validateCompiladoForm = (): boolean => {
    if (!dadosCompilado.cidade?.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha a cidade.", variant: "destructive" });
      return false;
    }
    if (!dadosCompilado.estado?.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha o estado.", variant: "destructive" });
      return false;
    }
    if (!dadosCompilado.vagas || dadosCompilado.vagas.length === 0) {
      toast({ title: "Campo obrigatório", description: "Adicione pelo menos uma vaga.", variant: "destructive" });
      return false;
    }
    // Verificar se todas as vagas têm código e cargo preenchidos
    const vagasInvalidas = dadosCompilado.vagas.some(v => !v.codigo?.trim() || !v.cargo?.trim());
    if (vagasInvalidas) {
      toast({ title: "Campo obrigatório", description: "Preencha o código e cargo de todas as vagas.", variant: "destructive" });
      return false;
    }
    // Validar contato de captação
    if (dadosCompilado.contato.tipo === 'whatsapp' && !dadosCompilado.contato.valor?.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha o número de WhatsApp.", variant: "destructive" });
      return false;
    }
    if (dadosCompilado.contato.tipo === 'email' && !dadosCompilado.contato.valor?.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha o e-mail de captação.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleFormSubmit = async (dados: RecrutadoraData) => {
    // Validar antes de enviar
    if (!validateIndividualForm(dados)) return;

    try {
      toast({ title: "Processando...", description: "Criando solicitação..." });

      const { data, error } = await supabase.functions.invoke('criar-solicitacao', {
        body: {
          codigo: dados.codigoPS,
          cargo: dados.nomeVaga,
          tipoContrato: dados.tipoContrato,
          modeloCartaz: tipoCartaz === 'compilado' ? `compilado-${modeloSelecionado}` : modeloSelecionado,
          local: `${dados.cidade} - ${dados.estado}`,
          contato: dados.captacaoCurriculo === 'whatsapp' 
            ? { tipo: 'whatsapp', valor: dados.whatsappNumber || '' }
            : dados.captacaoCurriculo === 'email'
            ? { tipo: 'email', valor: dados.emailCaptacao || '' }
            : { tipo: 'site', valor: modeloSelecionado === 'marisa' ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br' },
          requisitos: dados.requisitos.join('\n• '),
          atividades: null,
          linkVaga: null,
          isPcd: dados.isPcd || false,
          userId: user?.id || null
        }
      });

      if (error) throw error;

      toast({
        title: "Solicitação criada com sucesso!",
        description: "Um link de finalização foi enviado para o Monday.com."
      });
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro", description: "Não foi possível criar a solicitação.", variant: "destructive" });
    }
  };

  const handleFinalizarDireto = async (dados: RecrutadoraData) => {
    // Validar antes de enviar
    if (!validateIndividualForm(dados)) return;

    try {
      toast({ title: "Processando...", description: "Criando solicitação..." });

      // Criar solicitação sem enviar ao Monday ainda
      const { data, error } = await supabase.functions.invoke('criar-solicitacao', {
        body: {
          codigo: dados.codigoPS,
          cargo: dados.nomeVaga,
          tipoContrato: dados.tipoContrato,
          modeloCartaz: tipoCartaz === 'compilado' ? `compilado-${modeloSelecionado}` : modeloSelecionado,
          local: `${dados.cidade} - ${dados.estado}`,
          contato: dados.captacaoCurriculo === 'whatsapp' 
            ? { tipo: 'whatsapp', valor: dados.whatsappNumber || '' }
            : dados.captacaoCurriculo === 'email'
            ? { tipo: 'email', valor: dados.emailCaptacao || '' }
            : { tipo: 'site', valor: modeloSelecionado === 'marisa' ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br' },
          requisitos: dados.requisitos.join('\n• '),
          atividades: null,
          linkVaga: null,
          isPcd: dados.isPcd || false,
          userId: user?.id || null,
          skipMonday: true // Flag para não criar item no Monday
        }
      });

      if (error) throw error;

      // Redirecionar para a página de finalização
      if (data?.solicitacaoId) {
        navigate(`/finalizar/${data.solicitacaoId}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro", description: "Não foi possível criar a solicitação.", variant: "destructive" });
    }
  };

  const handleFinalizarCompiladoDireto = async () => {
    // Validar antes de enviar
    if (!validateCompiladoForm()) return;

    try {
      toast({ title: "Processando...", description: "Criando solicitação..." });

      const { data, error } = await supabase.functions.invoke('criar-solicitacao', {
        body: {
          codigo: dadosCompilado.vagas[0].codigo,
          cargo: dadosCompilado.vagas.map(v => v.cargo).join(', '),
          tipoContrato: 'Compilado',
          modeloCartaz: `compilado-${dadosCompilado.clientTemplate}`,
          local: dadosCompilado.local,
          contato: dadosCompilado.contato,
          requisitos: dadosCompilado.requisitos,
          atividades: null,
          linkVaga: null,
          emailSolicitante: null,
          isPcd: dadosCompilado.isPcd || false,
          userId: user?.id || null,
          skipMonday: true
        }
      });

      if (error) throw error;

      if (data?.solicitacaoId) {
        navigate(`/finalizar/${data.solicitacaoId}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro", description: "Não foi possível criar a solicitação.", variant: "destructive" });
    }
  };

  const handleCompiladoGenerate = async () => {
    // Validar antes de enviar
    if (!validateCompiladoForm()) return;

    try {
      toast({ title: "Processando...", description: "Criando solicitação..." });

      const { error } = await supabase.functions.invoke('criar-solicitacao', {
        body: {
          codigo: dadosCompilado.vagas[0].codigo,
          cargo: dadosCompilado.vagas.map(v => v.cargo).join(', '),
          tipoContrato: 'Compilado',
          modeloCartaz: `compilado-${dadosCompilado.clientTemplate}`,
          local: dadosCompilado.local,
          contato: dadosCompilado.contato,
          requisitos: dadosCompilado.requisitos,
          atividades: null,
          linkVaga: null,
          emailSolicitante: null,
          isPcd: dadosCompilado.isPcd || false,
          userId: user?.id || null
        }
      });

      if (error) throw error;

      toast({
        title: "Solicitação criada com sucesso!",
        description: "Um link de finalização foi enviado para o Monday.com."
      });

    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro", description: "Não foi possível criar a solicitação.", variant: "destructive" });
    }
  };

  const getIndividualPreviewData = () => ({
    image: dadosIndividual.image || '',
    cargo: dadosIndividual.nomeVaga || '',
    cidade: dadosIndividual.cidade || '',
    estado: dadosIndividual.estado || '',
    codigo: dadosIndividual.codigoPS || '',
    tipoContrato: dadosIndividual.tipoContrato || '',
    requisitos: dadosIndividual.requisitos?.join('\n• ') || '',
    isPcd: dadosIndividual.isPcd || false,
    clientTemplate: modeloSelecionado as 'padrao' | 'marisa' | 'weg' | 'vaga-interna' | 'dm-card',
    contato: dadosIndividual.captacaoCurriculo === 'whatsapp'
      ? { tipo: 'whatsapp' as const, valor: dadosIndividual.whatsappNumber || '' }
      : dadosIndividual.captacaoCurriculo === 'email'
      ? { tipo: 'email' as const, valor: dadosIndividual.emailCaptacao || '' }
      : { tipo: 'site' as const, valor: modeloSelecionado === 'marisa' ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br' },
    local: dadosIndividual.cidade && dadosIndividual.estado ? `${dadosIndividual.cidade} - ${dadosIndividual.estado}` : ""
  });

  const updateCompiladoData = (newData: CompiladoData) => {
    const updated = new CompiladoDataImpl();
    updated.image = newData.image || '';
    updated.cidade = newData.cidade;
    updated.estado = newData.estado;
    updated.vagas = newData.vagas;
    updated.requisitos = newData.requisitos;
    updated.isPcd = newData.isPcd;
    updated.clientTemplate = newData.clientTemplate;
    updated.contato = newData.contato;
    setDadosCompilado(updated);
  };

  const renderPreview = () => {
    if (tipoCartaz === 'individual') {
      return (
        <>
          {modeloSelecionado === 'padrao' && <CartazPreview data={getIndividualPreviewData()} />}
          {modeloSelecionado === 'vaga-interna' && <CartazPreviewVagaInterna data={getIndividualPreviewData()} />}
          {modeloSelecionado === 'weg' && <CartazPreviewWeg data={getIndividualPreviewData()} />}
          {modeloSelecionado === 'marisa' && <CartazPreviewMarisa data={getIndividualPreviewData()} />}
          {modeloSelecionado === 'dm-card' && <CartazPreviewDMCard data={getIndividualPreviewData()} />}
        </>
      );
    }
    return dadosCompilado.clientTemplate === 'padrao' 
      ? <CompiladoPreview data={dadosCompilado} />
      : <CompiladoPreviewMarisa data={dadosCompilado} />;
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-sm z-50 shrink-0">
        <div className="px-6 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary">Solicitar Cartaz de Vaga</h1>
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            ← Voltar
          </Button>
        </div>
      </header>

      {/* Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Form (Scrollable) */}
        <div className="w-full lg:w-1/2 xl:w-[45%] overflow-y-auto border-r bg-background">
          <div className="p-6 xl:px-10 xl:py-8 max-w-2xl mx-auto space-y-6">
            {/* Type & Model Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo de Cartaz</h3>
                <Tabs 
                  defaultValue="individual" 
                  onValueChange={(value) => setTipoCartaz(value as 'individual' | 'compilado')}
                >
                  <TabsList className="grid w-full max-w-xs grid-cols-2 h-10">
                    <TabsTrigger value="individual" className="text-sm">Individual</TabsTrigger>
                    <TabsTrigger value="compilado" className="text-sm">Compilado</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Modelo</h3>
                <Tabs 
                  defaultValue="padrao" 
                  onValueChange={(value) => {
                    setModeloSelecionado(value as 'padrao' | 'marisa' | 'weg' | 'vaga-interna' | 'dm-card');
                    if (tipoCartaz === 'compilado') {
                      const updated = new CompiladoDataImpl();
                      Object.assign(updated, dadosCompilado);
                      updated.clientTemplate = value as 'padrao' | 'marisa' | 'weg';
                      if (updated.contato.tipo === 'site') {
                        updated.contato = { 
                          tipo: 'site',
                          valor: value === 'marisa' ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br'
                        };
                      }
                      setDadosCompilado(updated);
                    }
                  }}
                >
                  <TabsList className={tipoCartaz === 'compilado' ? 'grid w-full max-w-xs grid-cols-2' : 'grid w-full max-w-md grid-cols-4'}>
                    <TabsTrigger value="padrao">Tradicional</TabsTrigger>
                    {tipoCartaz === 'individual' && <TabsTrigger value="vaga-interna">Vaga Interna</TabsTrigger>}
                    {tipoCartaz === 'individual' && <TabsTrigger value="weg">WEG</TabsTrigger>}
                    <TabsTrigger value="marisa">Marisa</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Form */}
            {tipoCartaz === 'individual' ? (
              <RecrutadoraForm 
                onSubmit={handleFormSubmit} 
                data={dadosIndividual}
                onChange={setDadosIndividual}
              />
            ) : (
              <CompiladoForm 
                data={dadosCompilado} 
                onChange={updateCompiladoData}
              />
            )}

            {/* Actions */}
            <div className="pt-4 border-t pb-6">
              {isEditor ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => tipoCartaz === 'individual' ? handleFormSubmit(dadosIndividual) : handleCompiladoGenerate()} 
                    className="flex-1 h-12" 
                    size="lg"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar ao Monday
                  </Button>
                  <Button 
                    onClick={() => tipoCartaz === 'individual' ? handleFinalizarDireto(dadosIndividual) : handleFinalizarCompiladoDireto()} 
                    variant="outline" 
                    className="flex-1 h-12 border-2" 
                    size="lg"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Finalizar Cartaz
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => tipoCartaz === 'individual' ? handleFormSubmit(dadosIndividual) : handleCompiladoGenerate()} 
                  className="w-full h-12" 
                  size="lg"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar ao Monday
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Preview (Fixed) */}
        <div className="hidden lg:flex w-1/2 xl:w-[55%] bg-gradient-to-br from-muted/40 to-muted/20 items-center justify-center p-6 xl:p-10 overflow-hidden">
          <div className="flex flex-col items-center gap-4 h-full w-full max-w-[520px] xl:max-w-[580px]">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Preview em Tempo Real</h3>
            <div className="flex-1 flex items-center justify-center w-full min-h-0">
              <div className="cartaz-container-large">
                {renderPreview()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Preview Toggle - shows at bottom on mobile */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button 
          size="lg" 
          className="rounded-full shadow-lg h-14 w-14"
          onClick={() => {
            // Could implement a mobile preview modal here
            toast({ title: "Preview", description: "Use um dispositivo maior para ver a preview em tempo real." });
          }}
        >
          👁️
        </Button>
      </div>

      <MondayItemSelector
        open={showMondaySelector}
        onClose={() => {
          setShowMondaySelector(false);
          setPendingFinalizacao(null);
        }}
        onSelect={(item) => {
          console.log('Item selecionado:', item);
          // Navegar para o editor com o item pré-selecionado
          if (pendingFinalizacao) {
            toast({
              title: "Funcionalidade em desenvolvimento",
              description: "A finalização direta será implementada em breve."
            });
          }
        }}
        onCreateNew={(groupId) => {
          console.log('Criar novo item no grupo:', groupId);
          if (pendingFinalizacao) {
            toast({
              title: "Funcionalidade em desenvolvimento",
              description: "A criação de nova linha será implementada em breve."
            });
          }
        }}
      />
    </div>
  );
};
