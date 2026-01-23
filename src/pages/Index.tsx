import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, FileText, Sparkles, ArrowRight } from "lucide-react";
import novoTempoLogo from "@/assets/novo-tempo-logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={novoTempoLogo} alt="Novo Tempo RH" className="h-10" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-secondary/10 px-3 py-1.5 rounded-full font-medium">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Sistema de Cartazes
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Crie cartazes profissionais em minutos
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 tracking-tight">
            Gerador de Cartazes de Vagas
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ferramenta completa para criação de material visual de divulgação de vagas 
            com templates personalizados e integração com Monday.com
          </p>
        </div>

        {/* Cards de Opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Dashboard de Recrutadoras */}
          <Card 
            className="group cursor-pointer card-interactive border-2 border-transparent hover:border-secondary/30 overflow-hidden"
            onClick={() => navigate('/dashboard')}
          >
            <CardContent className="p-0">
              <div className="gradient-brand p-8 text-white">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <Users className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Solicitar Cartaz
                </h2>
                <p className="text-white/80 text-sm">
                  Para recrutadoras
                </p>
              </div>
              <div className="p-6">
                <p className="text-muted-foreground mb-6">
                  Formulário completo com validação automática, preview em tempo real e envio direto para o Monday.com.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">Acessar dashboard</span>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editor Manual */}
          <Card 
            className="group cursor-pointer card-interactive border-2 border-transparent hover:border-secondary/30 overflow-hidden"
            onClick={() => navigate('/editor')}
          >
            <CardContent className="p-0">
              <div className="gradient-accent p-8 text-white">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Editor Manual
                </h2>
                <p className="text-white/80 text-sm">
                  Para designers
                </p>
              </div>
              <div className="p-6">
                <p className="text-muted-foreground mb-6">
                  Criação livre e personalizada de cartazes com controle total sobre cada elemento do design.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">Abrir editor</span>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-semibold text-primary mb-2">Imagens com IA</h3>
            <p className="text-sm text-muted-foreground">Geração automática de imagens profissionais para seus cartazes</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-semibold text-primary mb-2">Múltiplos Templates</h3>
            <p className="text-sm text-muted-foreground">Modelos para diferentes clientes e tipos de vaga</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-semibold text-primary mb-2">Integração Monday</h3>
            <p className="text-sm text-muted-foreground">Envio automático para o quadro de solicitações</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Novo Tempo Consultoria e RH - Sistema de Cartazes
        </div>
      </footer>
    </div>
  );
};

export default Index;