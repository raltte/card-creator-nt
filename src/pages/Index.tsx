import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, FileText } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-nt-light/10 to-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-nt-dark mb-4">
            Novo Tempo RH
          </h1>
          <p className="text-xl text-muted-foreground">
            Sistema de Geração de Cartazes de Vagas
          </p>
        </div>

        {/* Cards de Opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Dashboard de Recrutadoras */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-nt-light">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Users className="w-16 h-16 mx-auto text-nt-light" />
              </div>
              <h2 className="text-2xl font-bold text-nt-dark mb-4">
                Dashboard de Recrutadoras
              </h2>
              <p className="text-muted-foreground mb-6">
                Formulário completo para solicitação de cartazes de vagas com todos os campos necessários.
              </p>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full"
                size="lg"
              >
                Acessar Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Editor Manual */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-nt-light">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <FileText className="w-16 h-16 mx-auto text-nt-light" />
              </div>
              <h2 className="text-2xl font-bold text-nt-dark mb-4">
                Editor Manual
              </h2>
              <p className="text-muted-foreground mb-6">
                Criação rápida e personalizada de cartazes com preview em tempo real.
              </p>
              <Button 
                onClick={() => navigate('/editor')}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Abrir Editor
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-muted-foreground">
          <p>© 2024 Novo Tempo Consultoria e RH - Sistema de Cartazes</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
