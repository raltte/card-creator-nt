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

const SITE_MAP: Record<string, string> = {
  "Grupo Novo Tempo": "gruponvt.com.br",
  "Novo Tempo RH": "novotemporh.com.br",
  "Tramasso": "tramassoidh.com.br",
};

interface AssinaturaFormProps {
  data: AssinaturaData;
  onChange: (data: AssinaturaData) => void;
}

export const AssinaturaForm = ({ data, onChange }: AssinaturaFormProps) => {
  const update = (field: keyof AssinaturaData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    update("telefone", formatPhone(e.target.value));
  };

  const handleEmpresaChange = (empresa: string) => {
    onChange({ ...data, empresa, site: SITE_MAP[empresa] || data.site });
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 260;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        // Center-crop to square
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);

        update("fotoUrl", canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
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
            placeholder="Digite seu nome completo"
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
          <Select value={data.empresa} onValueChange={handleEmpresaChange}>
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
            placeholder="(12) 3008-0528"
            value={data.telefone}
            onChange={handlePhoneChange}
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
              className="w-16 h-16 rounded-lg object-cover mt-2"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
