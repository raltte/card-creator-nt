import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecrutadoraForm, RecrutadoraData } from "./RecrutadoraForm";
import { CompiladoForm, CompiladoData } from "./CompiladoForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import novoTempoLogo from "@/assets/novo-tempo-logo-v4.png";
import marisaLogo from "@/assets/marisa-logo-branco.png";

export const RecrutadoraDashboard = () => {
  const { toast } = useToast();
  const [tipoCartaz, setTipoCartaz] = useState<'individual' | 'compilado'>('individual');
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
                    if (tipoCartaz === 'compilado') {
                      setDadosCompilado({
                        ...dadosCompilado,
                        clientTemplate: value as 'padrao' | 'marisa',
                        contato: { 
                          ...dadosCompilado.contato,
                          valor: value === 'marisa' ? 'novotemporh.com.br/marisa' : 'novotemporh.com.br'
                        }
                      });
                    }
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="padrao">Tradicional</TabsTrigger>
                    <TabsTrigger value="marisa">Marisa</TabsTrigger>
                  </TabsList>

                  <TabsContent value="padrao" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="overflow-hidden">
                        <div className="aspect-[432/1200] bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                          <img src={novoTempoLogo} alt="Exemplo Tradicional Individual" className="w-32" />
                        </div>
                        <CardContent className="p-3">
                          <p className="text-xs text-center text-muted-foreground">Individual Tradicional</p>
                        </CardContent>
                      </Card>
                      <Card className="overflow-hidden">
                        <div className="aspect-[432/900] bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                          <img src={novoTempoLogo} alt="Exemplo Tradicional Compilado" className="w-32" />
                        </div>
                        <CardContent className="p-3">
                          <p className="text-xs text-center text-muted-foreground">Compilado Tradicional</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="marisa" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="overflow-hidden">
                        <div className="aspect-[960/1200] bg-[#E5007E] flex items-center justify-center">
                          <img src={marisaLogo} alt="Exemplo Marisa Individual" className="w-32" />
                        </div>
                        <CardContent className="p-3">
                          <p className="text-xs text-center text-muted-foreground">Individual Marisa</p>
                        </CardContent>
                      </Card>
                      <Card className="overflow-hidden">
                        <div className="aspect-[432/900] bg-[#E5007E] flex items-center justify-center">
                          <img src={marisaLogo} alt="Exemplo Marisa Compilado" className="w-32" />
                        </div>
                        <CardContent className="p-3">
                          <p className="text-xs text-center text-muted-foreground">Compilado Marisa</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Formulários */}
              <TabsContent value="individual" className="space-y-6 mt-6">
                <RecrutadoraForm onSubmit={handleFormSubmit} />
                <Button onClick={() => {}} className="w-full" size="lg">
                  Enviar Solicitação
                </Button>
              </TabsContent>

              <TabsContent value="compilado" className="space-y-6 mt-6">
                <CompiladoForm data={dadosCompilado} onChange={setDadosCompilado} />
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
