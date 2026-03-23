import { useState } from "react";
import { AssinaturaForm, AssinaturaData } from "@/components/AssinaturaForm";
import { AssinaturaPreview } from "@/components/AssinaturaPreview";
const AssinaturaEmail = () => {
  const [data, setData] = useState<AssinaturaData>({
    nome: "",
    cargo: "",
    empresa: "Grupo Novo Tempo",
    telefone: "",
    site: "gruponvt.com.br",
    local: "",
    fotoUrl: "",
  });

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
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
