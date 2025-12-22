import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecrutadoraForm, RecrutadoraData } from "./RecrutadoraForm";
import { CompiladoForm, CompiladoData } from "./CompiladoForm";
import { CartazPreview } from "./CartazPreview";
import { CartazPreviewMarisa } from "./CartazPreviewMarisa";
import { CartazPreviewWeg } from "./CartazPreviewWeg";
import { CompiladoPreview } from "./CompiladoPreview";
import { CompiladoPreviewMarisa } from "./CompiladoPreviewMarisa";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Download } from "lucide-react";
import html2canvas from "html2canvas";

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
  const previewRef = useRef<HTMLDivElement>(null);
  const [tipoCartaz, setTipoCartaz] = useState<'individual' | 'compilado'>('individual');
  const [modeloSelecionado, setModeloSelecionado] = useState<'padrao' | 'marisa' | 'weg'>('padrao');
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
  const [dadosCompilado, setDadosCompilado] = useState<CompiladoDataImpl>(() => new CompiladoDataImpl());

  const handleFormSubmit = async (dados: RecrutadoraData) => {
    try {
      toast({ title: "Processando...", description: "Criando solicitação..." });

      const { error } = await supabase.functions.invoke('criar-solicitacao', {
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
          emailSolicitante: dados.emailSolicitante || null,
          isPcd: dados.isPcd || false
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
          emailSolicitante: null,
          isPcd: dadosCompilado.isPcd || false
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

  const handleDownloadPng = async () => {
    if (!previewRef.current) return;
    
    try {
      toast({ title: "Gerando imagem...", description: "Aguarde..." });
      
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      
      const link = document.createElement('a');
      link.download = `cartaz-${tipoCartaz}-${modeloSelecionado}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({ title: "Download iniciado!", description: "O cartaz foi baixado com sucesso." });
    } catch (error) {
      console.error('Erro ao gerar PNG:', error);
      toast({ title: "Erro", description: "Não foi possível gerar o PNG.", variant: "destructive" });
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
    clientTemplate: modeloSelecionado as 'padrao' | 'marisa' | 'weg',
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
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Tipo de Cartaz</h3>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="individual">Individual</TabsTrigger>
                  <TabsTrigger value="compilado">Compilado</TabsTrigger>
                </TabsList>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Modelo</h3>
                <Tabs 
                  defaultValue="padrao" 
                  onValueChange={(value) => {
                    setModeloSelecionado(value as 'padrao' | 'marisa' | 'weg');
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
                  <TabsList className={tipoCartaz === 'compilado' ? 'grid w-full grid-cols-2' : 'grid w-full grid-cols-3'}>
                    <TabsTrigger value="padrao">Tradicional</TabsTrigger>
                    {tipoCartaz === 'individual' && <TabsTrigger value="weg">WEG</TabsTrigger>}
                    <TabsTrigger value="marisa">Marisa</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

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
                    <div ref={previewRef}>
                      {modeloSelecionado === 'padrao' && (
                        <CartazPreview data={getIndividualPreviewData()} />
                      )}
                      {modeloSelecionado === 'weg' && (
                        <CartazPreviewWeg data={getIndividualPreviewData()} />
                      )}
                      {modeloSelecionado === 'marisa' && (
                        <CartazPreviewMarisa data={getIndividualPreviewData()} />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button onClick={() => handleFormSubmit(dadosIndividual)} className="flex-1" size="lg">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar ao Monday
                  </Button>
                  <Button onClick={handleDownloadPng} variant="outline" className="flex-1" size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PNG
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="compilado" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <CompiladoForm 
                      data={dadosCompilado} 
                      onChange={updateCompiladoData}
                    />
                  </div>
                  <div className="sticky top-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Preview em Tempo Real</h3>
                    <div ref={previewRef}>
                      {dadosCompilado.clientTemplate === 'padrao' ? (
                        <CompiladoPreview data={dadosCompilado} />
                      ) : (
                        <CompiladoPreviewMarisa data={dadosCompilado} />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleCompiladoGenerate} className="flex-1" size="lg">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar ao Monday
                  </Button>
                  <Button onClick={handleDownloadPng} variant="outline" className="flex-1" size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PNG
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};