import { useState } from "react";
import { AssinaturaForm, AssinaturaData } from "@/components/AssinaturaForm";
import { AssinaturaPreview } from "@/components/AssinaturaPreview";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AssinaturaEmail = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AssinaturaData>({
    nome: "",
    cargo: "",
    empresa: "Grupo Novo Tempo",
    telefone: "",
    site: "novotemporh.com.br",
    local: "",
    fotoUrl: "",
  });

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate("/painel")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao painel
        </Button>

        <h1 className="text-2xl font-bold mb-6">Gerador de Assinatura de E-mail</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AssinaturaForm data={data} onChange={setData} />
          <AssinaturaPreview data={data} />
        </div>
      </div>
    </div>
  );
};

export default AssinaturaEmail;
