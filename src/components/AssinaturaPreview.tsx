import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AssinaturaData } from "./AssinaturaForm";

interface AssinaturaPreviewProps {
  data: AssinaturaData;
}

const GRUPO_NVT_LOGO_URL = "https://jqpjcoitrmochijrgfbc.supabase.co/storage/v1/object/public/email-assets/grupo-nvt-logo.png";

const generateSignatureHtml = (data: AssinaturaData): string => {
  const fotoHtml = data.fotoUrl
    ? `<img src="${data.fotoUrl}" width="130" height="130" style="border-radius:12px;object-fit:cover;display:block;" alt="Foto" />`
    : `<div style="width:130px;height:130px;border-radius:12px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:40px;color:#9ca3af;">👤</div>`;

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
              <tr><td style="font-size:14px;color:#555;padding-bottom:2px;padding-right:20px;">${data.cargo || "Cargo"}</td></tr>
              <tr><td style="font-size:14px;color:#555;padding-right:20px;">${data.empresa}</td></tr>
            </table>
          </td>
          <td style="vertical-align:top;padding-left:20px;">
            <table cellpadding="0" cellspacing="0" border="0">
              ${data.telefone ? `<tr>
                <td style="padding-bottom:8px;vertical-align:middle;padding-right:10px;">
                  <img src="https://cdn-icons-png.flaticon.com/16/455/455705.png" width="16" height="16" alt="phone" style="display:block;" />
                </td>
                <td style="font-size:14px;padding-bottom:8px;vertical-align:middle;">
                  <a href="tel:${data.telefone.replace(/\D/g,'')}" style="color:#1a1a1a;text-decoration:none;">${data.telefone}</a>
                </td>
              </tr>` : ''}
              ${data.site ? `<tr>
                <td style="padding-bottom:8px;vertical-align:middle;padding-right:10px;">
                  <img src="https://cdn-icons-png.flaticon.com/16/1006/1006771.png" width="16" height="16" alt="web" style="display:block;" />
                </td>
                <td style="font-size:14px;padding-bottom:8px;vertical-align:middle;">
                  <a href="https://${data.site}" style="color:#1a1a1a;text-decoration:none;">${data.site}</a>
                </td>
              </tr>` : ''}
              ${data.local ? `<tr>
                <td style="padding-bottom:8px;vertical-align:middle;padding-right:10px;">
                  <img src="https://cdn-icons-png.flaticon.com/16/684/684908.png" width="16" height="16" alt="loc" style="display:block;" />
                </td>
                <td style="font-size:14px;padding-bottom:8px;vertical-align:middle;">${data.local}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="border-top:2px solid #e5e7eb;padding-top:12px;">
      <span style="font-family:'Trebuchet MS',Arial,sans-serif;font-size:22px;font-weight:700;color:#555;letter-spacing:-0.5px;">grupo </span><span style="font-family:'Trebuchet MS',Arial,sans-serif;font-size:22px;font-weight:900;color:#2dd4a8;letter-spacing:-0.5px;">NVT</span>
    </td>
  </tr>
</table>`;
};

export const AssinaturaPreview = ({ data }: AssinaturaPreviewProps) => {
  const [copied, setCopied] = useState(false);

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
        <div
          className="bg-white p-6 rounded-lg border"
          dangerouslySetInnerHTML={{ __html: signatureHtml }}
        />

        <p className="text-sm text-muted-foreground mt-4">
          <strong>Como usar:</strong> Clique em "Copiar assinatura", abra o Gmail → Configurações → Ver todas as configurações → Assinatura → Cole com Ctrl+V.
        </p>
      </CardContent>
    </Card>
  );
};
