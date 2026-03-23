import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Globe, MapPin, Phone, X, Settings, MousePointerClick, ClipboardPaste, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AssinaturaData } from "./AssinaturaForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AssinaturaPreviewProps {
  data: AssinaturaData;
}

const LOGO_URLS: Record<string, string> = {
  "Grupo Novo Tempo": "https://jqpjcoitrmochijrgfbc.supabase.co/storage/v1/object/public/email-assets/logo-grupo-nvt.png",
  "Novo Tempo RH": "https://jqpjcoitrmochijrgfbc.supabase.co/storage/v1/object/public/email-assets/logo-novo-tempo-rh.png",
  "Tramasso": "https://jqpjcoitrmochijrgfbc.supabase.co/storage/v1/object/public/email-assets/logo-tramasso.png",
};

const ICON_URLS = {
  phone: "https://jqpjcoitrmochijrgfbc.supabase.co/storage/v1/object/public/email-assets/icon-phone.png",
  web: "https://jqpjcoitrmochijrgfbc.supabase.co/storage/v1/object/public/email-assets/icon-globe.png",
  location: "https://jqpjcoitrmochijrgfbc.supabase.co/storage/v1/object/public/email-assets/icon-location.png",
};

const generateSignatureHtml = (data: AssinaturaData): string => {
  const logoUrl = LOGO_URLS[data.empresa] || LOGO_URLS["Grupo Novo Tempo"];

  const fotoHtml = data.fotoUrl
    ? `<img src="${data.fotoUrl}" width="100" height="100" style="border-radius:10px;object-fit:cover;display:block;width:100px;height:100px;" alt="Foto" />`
    : `<div style="width:100px;height:100px;border-radius:10px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:32px;color:#9ca3af;">👤</div>`;

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:600px;">
  <tr>
    <td style="padding:0 0 16px 0;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:top;padding-right:20px;">
            ${fotoHtml}
          </td>
          <td style="vertical-align:top;padding-right:20px;border-right:2px solid #e5e7eb;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr><td style="font-size:18px;font-weight:700;padding-bottom:4px;padding-right:20px;white-space:nowrap;">${data.nome || "Seu Nome"}</td></tr>
              <tr><td style="font-size:14px;color:#555;padding-bottom:2px;padding-right:20px;white-space:nowrap;">${data.cargo || "Cargo"}</td></tr>
              <tr><td style="font-size:14px;color:#555;padding-right:20px;white-space:nowrap;">${data.empresa}</td></tr>
            </table>
          </td>
          <td style="vertical-align:top;padding-left:20px;">
            <table cellpadding="0" cellspacing="0" border="0">
              ${data.telefone ? `<tr>
                <td style="padding-bottom:8px;vertical-align:middle;padding-right:10px;">
                  <img src="${ICON_URLS.phone}" width="16" height="16" alt="phone" style="display:block;width:16px;height:16px;" />
                </td>
                <td style="font-size:14px;padding-bottom:8px;vertical-align:middle;white-space:nowrap;">
                  <a href="tel:${data.telefone.replace(/\\D/g,'')}" style="color:#1a1a1a;text-decoration:none;">${data.telefone}</a>
                </td>
              </tr>` : ''}
              ${data.site ? `<tr>
                <td style="padding-bottom:8px;vertical-align:middle;padding-right:10px;">
                  <img src="${ICON_URLS.web}" width="16" height="16" alt="web" style="display:block;width:16px;height:16px;" />
                </td>
                <td style="font-size:14px;padding-bottom:8px;vertical-align:middle;white-space:nowrap;">
                  <a href="https://${data.site}" style="color:#1a1a1a;text-decoration:none;">${data.site}</a>
                </td>
              </tr>` : ''}
              ${data.local ? `<tr>
                <td style="padding-bottom:8px;vertical-align:middle;padding-right:10px;">
                  <img src="${ICON_URLS.location}" width="16" height="16" alt="loc" style="display:block;width:16px;height:16px;" />
                </td>
                <td style="font-size:14px;padding-bottom:8px;vertical-align:middle;white-space:nowrap;">${data.local}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="border-top:2px solid #e5e7eb;padding-top:12px;">
      <img src="${logoUrl}" width="140" height="auto" alt="${data.empresa}" style="display:block;" />
    </td>
  </tr>
</table>`;
};

const steps = [
  {
    icon: <Copy className="h-8 w-8 text-primary" />,
    title: "1. Assinatura copiada!",
    desc: "A assinatura já está na sua área de transferência. Agora vamos ao Gmail.",
  },
  {
    icon: <Settings className="h-8 w-8 text-primary" />,
    title: "2. Abra as Configurações do Gmail",
    desc: 'No Gmail, clique na engrenagem no canto superior direito e depois em "Ver todas as configurações".',
  },
  {
    icon: <MousePointerClick className="h-8 w-8 text-primary" />,
    title: '3. Vá até "Assinatura"',
    desc: 'Na aba "Geral", role até a seção "Assinatura". Clique em "+ Criar nova" ou edite a existente.',
  },
  {
    icon: <ClipboardPaste className="h-8 w-8 text-primary" />,
    title: "4. Cole a assinatura",
    desc: "Clique na área de texto da assinatura e cole com Ctrl+V (ou Cmd+V no Mac). A formatação será mantida.",
  },
  {
    icon: <CheckCircle2 className="h-8 w-8 text-green-600" />,
    title: "5. Salve as alterações",
    desc: 'Role até o final da página e clique em "Salvar alterações".',
  },
];

export const AssinaturaPreview = ({ data }: AssinaturaPreviewProps) => {
  const [copied, setCopied] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const logoUrl = LOGO_URLS[data.empresa] || LOGO_URLS["Grupo Novo Tempo"];

  const handleCopy = async () => {
    const html = generateSignatureHtml(data);

    try {
      const blob = new Blob([html], { type: "text/html" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": blob }),
      ]);
      setCopied(true);
      setShowTutorial(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setShowTutorial(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Preview</CardTitle>
          <Button onClick={handleCopy} size="sm" className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado!" : "Copiar assinatura"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-6 rounded-lg border overflow-x-auto">
            <table cellPadding="0" cellSpacing="0" border={0} style={{ fontFamily: "Arial,Helvetica,sans-serif", color: "#1a1a1a", maxWidth: "600px" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "0 0 16px 0" }}>
                    <table cellPadding="0" cellSpacing="0" border={0}>
                      <tbody>
                        <tr>
                          <td style={{ verticalAlign: "top", paddingRight: "20px" }}>
                            {data.fotoUrl ? (
                              <img src={data.fotoUrl} width={100} height={100} style={{ borderRadius: "10px", objectFit: "cover", display: "block", width: "100px", height: "100px" }} alt="Foto de perfil" />
                            ) : (
                              <div style={{ width: "100px", height: "100px", borderRadius: "10px", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", color: "#9ca3af" }}>👤</div>
                            )}
                          </td>
                          <td style={{ verticalAlign: "top", paddingRight: "20px", borderRight: "2px solid #e5e7eb" }}>
                            <table cellPadding="0" cellSpacing="0" border={0}>
                              <tbody>
                                <tr><td style={{ fontSize: "18px", fontWeight: 700, paddingBottom: "4px", paddingRight: "20px", whiteSpace: "nowrap" }}>{data.nome || "Seu Nome"}</td></tr>
                                <tr><td style={{ fontSize: "14px", color: "#555", paddingBottom: "2px", paddingRight: "20px", whiteSpace: "nowrap" }}>{data.cargo || "Cargo"}</td></tr>
                                <tr><td style={{ fontSize: "14px", color: "#555", paddingRight: "20px", whiteSpace: "nowrap" }}>{data.empresa}</td></tr>
                              </tbody>
                            </table>
                          </td>
                          <td style={{ verticalAlign: "top", paddingLeft: "20px" }}>
                            <table cellPadding="0" cellSpacing="0" border={0}>
                              <tbody>
                                {data.telefone && (
                                  <tr>
                                    <td style={{ paddingBottom: "8px", verticalAlign: "middle", paddingRight: "10px" }}><img src={ICON_URLS.phone} width={16} height={16} alt="phone" style={{ display: "block", width: "16px", height: "16px" }} /></td>
                                    <td style={{ fontSize: "14px", paddingBottom: "8px", verticalAlign: "middle", whiteSpace: "nowrap" }}><a href={`tel:${data.telefone.replace(/\D/g, "")}`} style={{ color: "#1a1a1a", textDecoration: "none" }}>{data.telefone}</a></td>
                                  </tr>
                                )}
                                {data.site && (
                                  <tr>
                                    <td style={{ paddingBottom: "8px", verticalAlign: "middle", paddingRight: "10px" }}><img src={ICON_URLS.web} width={16} height={16} alt="web" style={{ display: "block", width: "16px", height: "16px" }} /></td>
                                    <td style={{ fontSize: "14px", paddingBottom: "8px", verticalAlign: "middle", whiteSpace: "nowrap" }}><a href={`https://${data.site}`} style={{ color: "#1a1a1a", textDecoration: "none" }}>{data.site}</a></td>
                                  </tr>
                                )}
                                {data.local && (
                                  <tr>
                                    <td style={{ paddingBottom: "8px", verticalAlign: "middle", paddingRight: "10px" }}><img src={ICON_URLS.location} width={16} height={16} alt="loc" style={{ display: "block", width: "16px", height: "16px" }} /></td>
                                    <td style={{ fontSize: "14px", paddingBottom: "8px", verticalAlign: "middle", whiteSpace: "nowrap" }}>{data.local}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style={{ borderTop: "2px solid #e5e7eb", paddingTop: "12px" }}>
                    <img src={logoUrl} width={140} alt={data.empresa} style={{ display: "block" }} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Como colar no Gmail</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="shrink-0 rounded-xl bg-muted p-3">{step.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Button className="w-full mt-2" onClick={() => setShowTutorial(false)}>
            Entendi!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
