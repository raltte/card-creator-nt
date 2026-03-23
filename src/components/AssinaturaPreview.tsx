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
  phone: `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.89.33 1.76.63 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.15a2 2 0 0 1 2.11-.45c.84.3 1.71.51 2.6.63A2 2 0 0 1 22 16.92z"/></svg>`
  )}`,
  web: `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/></svg>`
  )}`,
  location: `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
  )}`,
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

export const AssinaturaPreview = ({ data }: AssinaturaPreviewProps) => {
  const [copied, setCopied] = useState(false);
  const logoUrl = LOGO_URLS[data.empresa] || LOGO_URLS["Grupo Novo Tempo"];

  const handleCopy = async () => {
    const html = generateSignatureHtml(data);
    
    try {
      // Copy as rich HTML so it pastes correctly in Gmail
      const blob = new Blob([html], { type: "text/html" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": blob }),
      ]);
      setCopied(true);
      toast({ title: "Assinatura copiada!", description: "Cole no Gmail em Configurações → Assinatura." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy as plain HTML
      await navigator.clipboard.writeText(html);
      setCopied(true);
      toast({ title: "HTML copiado!", description: "Cole o código HTML na sua assinatura." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const signatureHtml = generateSignatureHtml(data);

  return (
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
                            <img
                              src={data.fotoUrl}
                              width={100}
                              height={100}
                              style={{ borderRadius: "10px", objectFit: "cover", display: "block", width: "100px", height: "100px" }}
                              alt="Foto de perfil"
                            />
                          ) : (
                            <div
                              style={{
                                width: "100px",
                                height: "100px",
                                borderRadius: "10px",
                                background: "#e5e7eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "32px",
                                color: "#9ca3af",
                              }}
                            >
                              👤
                            </div>
                          )}
                        </td>
                        <td style={{ verticalAlign: "top", paddingRight: "20px", borderRight: "2px solid #e5e7eb" }}>
                          <table cellPadding="0" cellSpacing="0" border={0}>
                            <tbody>
                              <tr>
                                <td style={{ fontSize: "18px", fontWeight: 700, paddingBottom: "4px", paddingRight: "20px", whiteSpace: "nowrap" }}>
                                  {data.nome || "Seu Nome"}
                                </td>
                              </tr>
                              <tr>
                                <td style={{ fontSize: "14px", color: "#555", paddingBottom: "2px", paddingRight: "20px", whiteSpace: "nowrap" }}>
                                  {data.cargo || "Cargo"}
                                </td>
                              </tr>
                              <tr>
                                <td style={{ fontSize: "14px", color: "#555", paddingRight: "20px", whiteSpace: "nowrap" }}>{data.empresa}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                        <td style={{ verticalAlign: "top", paddingLeft: "20px" }}>
                          <table cellPadding="0" cellSpacing="0" border={0}>
                            <tbody>
                              {data.telefone ? (
                                <tr>
                                  <td style={{ paddingBottom: "8px", verticalAlign: "middle", paddingRight: "10px" }}>
                                    <Phone size={16} strokeWidth={2} style={{ display: "block", color: "#000000" }} />
                                  </td>
                                  <td style={{ fontSize: "14px", paddingBottom: "8px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                                    <a href={`tel:${data.telefone.replace(/\D/g, "")}`} style={{ color: "#1a1a1a", textDecoration: "none" }}>
                                      {data.telefone}
                                    </a>
                                  </td>
                                </tr>
                              ) : null}
                              {data.site ? (
                                <tr>
                                  <td style={{ paddingBottom: "8px", verticalAlign: "middle", paddingRight: "10px" }}>
                                    <Globe size={16} strokeWidth={2} style={{ display: "block", color: "#000000" }} />
                                  </td>
                                  <td style={{ fontSize: "14px", paddingBottom: "8px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                                    <a href={`https://${data.site}`} style={{ color: "#1a1a1a", textDecoration: "none" }}>
                                      {data.site}
                                    </a>
                                  </td>
                                </tr>
                              ) : null}
                              {data.local ? (
                                <tr>
                                  <td style={{ paddingBottom: "8px", verticalAlign: "middle", paddingRight: "10px" }}>
                                    <MapPin size={16} strokeWidth={2} style={{ display: "block", color: "#000000" }} />
                                  </td>
                                  <td style={{ fontSize: "14px", paddingBottom: "8px", verticalAlign: "middle", whiteSpace: "nowrap" }}>{data.local}</td>
                                </tr>
                              ) : null}
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

        <p className="text-sm text-muted-foreground mt-4">
          <strong>Como usar:</strong> Clique em "Copiar assinatura", abra o Gmail → Configurações → Ver todas as configurações → Assinatura → Cole com Ctrl+V.
        </p>
      </CardContent>
    </Card>
  );
};
