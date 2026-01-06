import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileImage, Megaphone, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Painel = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handlePatrocinado = () => {
    window.open("https://d92a3000-0e7a-4dcf-bd42-3c3c2f617783.lovableproject.com", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nt-light/10 to-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-nt-dark">
              Painel R&S
            </h1>
            <p className="text-muted-foreground text-sm">
              {user?.email}
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Solicitar Cartaz */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-nt-light">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <FileImage className="w-16 h-16 mx-auto text-nt-light" />
              </div>
              <h2 className="text-2xl font-bold text-nt-dark mb-4">
                Solicitar Cartaz de Vaga
              </h2>
              <p className="text-muted-foreground mb-6">
                Crie cartazes personalizados para divulgação de vagas de emprego.
              </p>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full"
                size="lg"
              >
                Acessar
              </Button>
            </CardContent>
          </Card>

          {/* Solicitar Patrocinado */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-nt-light">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Megaphone className="w-16 h-16 mx-auto text-nt-light" />
              </div>
              <h2 className="text-2xl font-bold text-nt-dark mb-4">
                Solicitar Patrocinado
              </h2>
              <p className="text-muted-foreground mb-6">
                Solicite impulsionamento de vagas nas redes sociais.
              </p>
              <Button 
                onClick={handlePatrocinado}
                className="w-full"
                size="lg"
              >
                Acessar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-muted-foreground">
          <p>© 2024 Novo Tempo Consultoria e RH</p>
        </div>
      </div>
    </div>
  );
};

export default Painel;
