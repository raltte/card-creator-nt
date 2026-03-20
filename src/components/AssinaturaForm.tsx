import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface AssinaturaData {
  nome: string;
  cargo: string;
  empresa: string;
  telefone: string;
  site: string;
  local: string;
  fotoUrl: string;
}

interface AssinaturaFormProps {
  data: AssinaturaData;
  onChange: (data: AssinaturaData) => void;
}

export const AssinaturaForm = ({ data, onChange }: AssinaturaFormProps) => {
  const update = (field: keyof AssinaturaData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update("fotoUrl", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Dados da Assinatura</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nome completo</Label>
          <Input
            placeholder="Ex: Vitor Alexandre"
            value={data.nome}
            onChange={(e) => update("nome", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Cargo / Setor</Label>
          <Input
            placeholder="Ex: Marketing"
            value={data.cargo}
            onChange={(e) => update("cargo", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Empresa</Label>
          <Select value={data.empresa} onValueChange={(v) => update("empresa", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Grupo Novo Tempo">Grupo Novo Tempo</SelectItem>
              <SelectItem value="Novo Tempo RH">Novo Tempo RH</SelectItem>
              <SelectItem value="Tramasso">Tramasso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input
            placeholder="Ex: (12) 3008-0528"
            value={data.telefone}
            onChange={(e) => update("telefone", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Site</Label>
          <Input
            placeholder="Ex: novotemporh.com.br"
            value={data.site}
            onChange={(e) => update("site", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Localização</Label>
          <Input
            placeholder="Ex: São José dos Campos - SP"
            value={data.local}
            onChange={(e) => update("local", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Foto de perfil</Label>
          <Input type="file" accept="image/*" onChange={handleFotoUpload} />
          {data.fotoUrl && (
            <img
              src={data.fotoUrl}
              alt="Preview"
              className="w-20 h-20 rounded-lg object-cover mt-2"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
