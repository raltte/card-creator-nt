import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Layers } from "lucide-react";
import { RecrutadoraForm, RecrutadoraData } from "./RecrutadoraForm";
import { CompiladoForm, CompiladoData } from "./CompiladoForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const RecrutadoraDashboard = () => {
  const { toast } = useToast();
  const [tipoCartaz, setTipoCartaz] = useState<'individual' | 'compilado' | null>(null);
  const [etapaAtual, setEtapaAtual] = useState<'selecaoTipo' | 'selecaoModelo' | 'formulario'>('selecaoTipo');
  const [modeloSelecionado, setModeloSelecionado] = useState<'padrao' | 'marisa'>('padrao');
  const [dadosCompilado, setDadosCompilado] = useState<CompiladoData>({
    image: '',
    local: '',
    vagas: [{ codigo: '', cargo: '' }],
    requisitos: '',
    isPcd: false,
    clientTemplate: 'padrao',
    contato: { tipo: 'site', valor: 'novotemporh.com.br' }
  });

  const handleTipoSelect = (tipo: 'individual' | 'compilado') => {
    setTipoCartaz(tipo);
    setEtapaAtual('selecaoModelo');
  };

  const handleModeloSelect = (modelo: 'padrao' | 'marisa') => {
    setModeloSelecionado(modelo);
    if (tipoCartaz === 'compilado') {
      setDadosCompilado({
        ...dadosCompilado,
        clientTemplate: modelo,
        contato: { 
          ...dadosCompilado.contato,
          valor: modelo === 'marisa' ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br'
        }
      });
    }
    setEtapaAtual('formulario');
  };

  const handleFormSubmit = async (dados: RecrutadoraData) => {
    try {
      toast({ title: "Processando...", description: "Criando solicitação..." });

      const { error } = await supabase.functions.invoke('criar-solicitacao', {
        body: {
          codigo: dados.codigoPS,
          cargo: dados.nomeVaga,
          tipoContrato: dados.tipoContrato,
          modeloCartaz: tipoCartaz === 'compilado' ? `compilado-${modeloSelecionado}` : modeloSelecionado,
          local: dados.cidadeEstado,
          contato: dados.captacaoCurriculo === 'whatsapp' 
            ? { tipo: 'whatsapp', valor: dados.whatsappNumber || '' }
            : dados.captacaoCurriculo === 'email'
            ? { tipo: 'email', valor: dados.emailCaptacao || '' }
            : { tipo: 'site', valor: modeloSelecionado === 'marisa' ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br' },
          requisitos: dados.requisitos.join('\n• '),
          atividades: null,
          linkVaga: null,
          emailSolicitante: dados.emailSolicitante || null
        }
      });

      if (error) throw error;

      toast({
        title: "Solicitação criada com sucesso!",
        description: "Um link de finalização foi enviado para o Monday.com."
      });

      setTimeout(() => {
        setEtapaAtual('selecaoTipo');
        setTipoCartaz(null);
      }, 2000);
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro", description: "Não foi possível criar a solicitação.", variant: "destructive" });
    }
  };

  const handleCompiladoGenerate = async () => {
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
          emailSolicitante: null
        }
      });

      if (error) throw error;

      toast({
        title: "Solicitação criada com sucesso!",
        description: "Um link de finalização foi enviado para o Monday.com."
      });

      setTimeout(() => {
        setEtapaAtual('selecaoTipo');
        setTipoCartaz(null);
      }, 2000);
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro", description: "Não foi possível criar a solicitação.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nt-light/10 to-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          {etapaAtual !== 'selecaoTipo' && (
            <Button variant="ghost" size="icon" onClick={() => {
              if (etapaAtual === 'formulario') setEtapaAtual('selecaoModelo');
              else if (etapaAtual === 'selecaoModelo') setEtapaAtual('selecaoTipo');
            }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-nt-dark">Dashboard de Recrutadoras</h1>
            <p className="text-muted-foreground">
              {etapaAtual === 'selecaoTipo' && 'Selecione o tipo de cartaz'}
              {etapaAtual === 'selecaoModelo' && 'Escolha o modelo'}
              {etapaAtual === 'formulario' && 'Preencha as informações'}
            </p>
          </div>
        </div>

        {etapaAtual === 'selecaoTipo' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 mx-auto text-nt-light mb-6" />
                <h2 className="text-2xl font-bold mb-4">Cartaz Individual</h2>
                <Button onClick={() => handleTipoSelect('individual')} className="w-full" size="lg">Selecionar</Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardContent className="p-8 text-center">
                <Layers className="w-16 h-16 mx-auto text-nt-light mb-6" />
                <h2 className="text-2xl font-bold mb-4">Cartaz Compilado</h2>
                <Button onClick={() => handleTipoSelect('compilado')} className="w-full" size="lg">Selecionar</Button>
              </CardContent>
            </Card>
          </div>
        ) : etapaAtual === 'selecaoModelo' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Modelo Padrão</h2>
                <Button onClick={() => handleModeloSelect('padrao')} className="w-full" size="lg">Selecionar</Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Modelo Marisa</h2>
                <Button onClick={() => handleModeloSelect('marisa')} className="w-full" size="lg">Selecionar</Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6">
              {tipoCartaz === 'compilado' ? (
                <>
                  <h2 className="text-2xl font-semibold mb-6">Informações do Compilado</h2>
                  <CompiladoForm data={dadosCompilado} onChange={setDadosCompilado} />
                  <Button onClick={handleCompiladoGenerate} className="w-full mt-6">Criar Solicitação</Button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold mb-6">Informações da Vaga</h2>
                  <RecrutadoraForm onSubmit={handleFormSubmit} />
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
