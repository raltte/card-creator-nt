import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecrutadoraForm, RecrutadoraData } from "./RecrutadoraForm";
import { CompiladoForm, CompiladoData } from "./CompiladoForm";
import { CartazPreview } from "./CartazPreview";
import { CartazPreviewMarisa } from "./CartazPreviewMarisa";
import { CompiladoPreview } from "./CompiladoPreview";
import { CompiladoPreviewMarisa } from "./CompiladoPreviewMarisa";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const RecrutadoraDashboard = () => {
  const { toast } = useToast();
  const [tipoCartaz, setTipoCartaz] = useState<'individual' | 'compilado'>('individual');
  const [modeloSelecionado, setModeloSelecionado] = useState<'padrao' | 'marisa'>('padrao');
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
    emailSolicitante: "",
    image: '',
    sugestaoImagem: ''
  });
  const [dadosCompilado, setDadosCompilado] = useState<CompiladoData>({
    image: '',
    local: '',
    vagas: [{ codigo: '', cargo: '' }],
    requisitos: '',
    isPcd: false,
    clientTemplate: 'padrao',
    contato: { tipo: 'site', valor: 'novotemporh.com.br' }
  });


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

    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro", description: "Não foi possível criar a solicitação.", variant: "destructive" });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-5xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-bold text-center">
              Solicitar Cartaz de Vaga
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs 
              defaultValue="individual" 
              onValueChange={(value) => setTipoCartaz(value as 'individual' | 'compilado')}
              className="space-y-6"
            >
              {/* Tabs de Tipo de Cartaz */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Tipo de Cartaz</h3>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="individual">Individual</TabsTrigger>
                  <TabsTrigger value="compilado">Compilado</TabsTrigger>
                </TabsList>
              </div>

              {/* Tabs de Modelo */}
              <div className="space-y-2">
<h3 className="text-sm font-medium text-muted-foreground">Modelo</h3>
                <Tabs 
                  defaultValue="padrao" 
                  onValueChange={(value) => {
                    setModeloSelecionado(value as 'padrao' | 'marisa');
                    // Atualizar o template do cliente e contato para compilado
                    if (tipoCartaz === 'compilado') {
                      setDadosCompilado({
                        ...dadosCompilado,
                        clientTemplate: value as 'padrao' | 'marisa',
                        contato: { 
                          tipo: dadosCompilado.contato.tipo,
                          valor: dadosCompilado.contato.tipo === 'site'
                            ? (value === 'marisa' ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br')
                            : dadosCompilado.contato.valor
                        }
                      });
                    }
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="padrao">Tradicional</TabsTrigger>
                    <TabsTrigger value="marisa">Marisa</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Formulários */}
              <TabsContent value="individual" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <RecrutadoraForm 
                      onSubmit={handleFormSubmit} 
                      data={dadosIndividual}
                      onChange={setDadosIndividual}
                    />
                  </div>
                  <div className="sticky top-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Preview em Tempo Real</h3>
                    {modeloSelecionado === 'padrao' ? (
                      <CartazPreview 
                        data={{
                          image: dadosIndividual.image || '',
                          cargo: dadosIndividual.nomeVaga || '',
                          local: dadosIndividual.cidadeEstado || '',
                          codigo: dadosIndividual.codigoPS || '',
                          tipoContrato: dadosIndividual.tipoContrato || '',
                          requisitos: dadosIndividual.requisitos?.join('\n• ') || '',
                          isPcd: false,
                          clientTemplate: 'padrao',
                          contato: dadosIndividual.captacaoCurriculo === 'whatsapp'
                            ? { tipo: 'whatsapp', valor: dadosIndividual.whatsappNumber || '' }
                            : dadosIndividual.captacaoCurriculo === 'email'
                            ? { tipo: 'email', valor: dadosIndividual.emailCaptacao || '' }
                            : { tipo: 'site', valor: 'novotemporh.com.br' }
                        }}
                      />
                    ) : (
                      <CartazPreviewMarisa 
                        data={{
                          image: dadosIndividual.image || '',
                          cargo: dadosIndividual.nomeVaga || '',
                          local: dadosIndividual.cidadeEstado || '',
                          codigo: dadosIndividual.codigoPS || '',
                          tipoContrato: dadosIndividual.tipoContrato || '',
                          requisitos: '',
                          isPcd: false,
                          clientTemplate: 'marisa',
                          contato: { tipo: 'site', valor: 'novotemporh.com.br/marisa' }
                        }}
                      />
                    )}
                  </div>
                </div>
                <Button onClick={() => handleFormSubmit(dadosIndividual)} className="w-full" size="lg">
                  Enviar Solicitação
                </Button>
              </TabsContent>

              <TabsContent value="compilado" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <CompiladoForm 
                      data={{
                        ...dadosCompilado,
                        clientTemplate: modeloSelecionado
                      }} 
                      onChange={(newData) => {
                        setDadosCompilado(newData);
                      }}
                    />
                  </div>
                  <div className="sticky top-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Preview em Tempo Real</h3>
                    {dadosCompilado.clientTemplate === 'padrao' ? (
                      <CompiladoPreview data={dadosCompilado} />
                    ) : (
                      <CompiladoPreviewMarisa data={dadosCompilado} />
                    )}
                  </div>
                </div>
                <Button onClick={handleCompiladoGenerate} className="w-full" size="lg">
                  Enviar Solicitação
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
