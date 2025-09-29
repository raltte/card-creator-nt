import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobTitle, sector, contractType, requirements } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Gerar 3 imagens com prompts diferentes baseados no setor e vaga
    const prompts = generateImagePrompts(jobTitle, sector, contractType, requirements);
    const imagePromises = prompts.map(async (prompt) => {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.images?.[0]?.image_url?.url;
    });

    const images = await Promise.all(imagePromises);
    const validImages = images.filter(img => img !== undefined);

    return new Response(JSON.stringify({ images: validImages }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao gerar imagens:', error);
    return new Response(JSON.stringify({ 
      error: 'Falha ao gerar imagens',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateImagePrompts(jobTitle: string, sector: string, contractType: string, requirements: string[]): string[] {
  const baseStyle = "Professional portrait photo, high quality, corporate style, bright lighting, clean background";
  
  // Mapear setores para contextos visuais
  const sectorContexts: Record<string, string> = {
    "Produção": "industrial warehouse or factory setting with safety equipment",
    "Administração": "modern office environment with computer and documents",
    "Vendas": "professional sales environment with products or meeting room",
    "Tecnologia": "tech office with computers, monitors, and modern workspace",
    "Saúde": "healthcare facility or medical office setting",
    "Educação": "classroom or educational environment",
    "Financeiro": "corporate office with financial documents and charts",
    "Recursos Humanos": "office meeting room or HR department setting",
    "Logística": "warehouse or distribution center environment",
    "Marketing": "creative office space with marketing materials",
    "Atendimento ao Cliente": "customer service desk or call center",
    "Segurança": "security checkpoint or monitoring station",
    "Limpeza": "professional cleaning in corporate environment",
    "Manutenção": "maintenance workshop or technical facility"
  };

  const context = sectorContexts[sector] || "professional office environment";
  
  return [
    `${baseStyle}, happy diverse professional working as ${jobTitle} in ${context}, smiling person, age 25-35, wearing appropriate work attire, holding relevant work tools or equipment, ultra high resolution`,
    
    `${baseStyle}, confident professional in ${jobTitle} role, ${context}, diverse ethnicity, professional appearance, engaging with work environment, modern workplace, age 30-40, ultra high resolution`,
    
    `${baseStyle}, skilled worker as ${jobTitle}, ${context}, friendly demeanor, professional uniform or business attire, workplace in background, diverse representation, age 25-45, ultra high resolution`
  ];
}