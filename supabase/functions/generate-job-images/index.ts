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
    const { jobTitle, sector, contractType, requirements, imageSuggestion, clientTemplate } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Gerar 3 imagens com prompts diferentes baseados no setor, vaga, sugestão do usuário e template do cliente
    const prompts = generateImagePrompts(jobTitle, sector, contractType, requirements, imageSuggestion, clientTemplate);
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

function generateImagePrompts(jobTitle: string, sector: string, contractType: string, requirements: string[], imageSuggestion?: string, clientTemplate?: string): string[] {
  // Contextos detalhados por setor com ambientes e características específicas
  const sectorDetails: Record<string, { environment: string, tools: string, style: string }> = {
    "Produção": {
      environment: "industrial factory floor, production line, manufacturing facility with machinery",
      tools: "safety helmet, safety vest, work gloves, manufacturing equipment",
      style: "industrial setting, bright overhead lighting, professional safety attire"
    },
    "Administração": {
      environment: "modern corporate office, desk with computer, organized workspace",
      tools: "laptop, documents, office supplies, organized files",
      style: "clean professional office, natural window lighting, business casual attire"
    },
    "Vendas": {
      environment: "retail store, sales floor, customer interaction area, product displays",
      tools: "tablet or smartphone, product samples, presentation materials",
      style: "dynamic sales environment, bright retail lighting, professional but approachable attire"
    },
    "Tecnologia": {
      environment: "modern tech office, multiple monitors, collaborative workspace, tech lab",
      tools: "computer, coding screens, tech equipment, innovative tools",
      style: "contemporary tech setting, ambient lighting, casual professional tech attire"
    },
    "Saúde": {
      environment: "healthcare facility, medical office, clinical setting, hospital environment",
      tools: "medical equipment, stethoscope, clipboard, healthcare tools",
      style: "clean clinical setting, professional medical attire, bright clinical lighting"
    },
    "Educação": {
      environment: "classroom, educational space, teaching environment, learning area",
      tools: "books, educational materials, whiteboard, teaching resources",
      style: "educational setting, natural lighting, professional educator attire"
    },
    "Logística": {
      environment: "warehouse, distribution center, loading dock, inventory area",
      tools: "forklift, scanner, pallet jack, logistics equipment",
      style: "large warehouse space, industrial lighting, work uniform with safety gear"
    },
    "Atendimento ao Cliente": {
      environment: "customer service desk, reception area, call center, service counter",
      tools: "headset, computer, phone, customer service tools",
      style: "welcoming service environment, professional friendly appearance"
    },
    "Limpeza": {
      environment: "professional facility, clean workspace, maintenance area",
      tools: "professional cleaning equipment, organized supplies",
      style: "clean professional setting, work uniform, bright lighting"
    },
    "Manutenção": {
      environment: "technical workshop, maintenance facility, equipment room",
      tools: "tools, technical equipment, maintenance gear",
      style: "technical workspace, work uniform, industrial lighting"
    }
  };

  const details = sectorDetails[sector] || {
    environment: "professional workplace, modern office setting",
    tools: "work equipment, professional tools",
    style: "professional environment, business attire"
  };

  // Prompts específicos para Marisa
  if (clientTemplate === 'marisa') {
    const marisaBase = "Professional photo in Marisa fashion retail store, modern retail environment with clothing displays and fashion merchandise";
    const marisaPink = "wearing professional attire with visible pink clothing item or accessory (pink blouse, pink shirt, pink scarf, or pink jacket)";
    
    if (imageSuggestion && imageSuggestion.trim()) {
      return [
        `${marisaBase}, ${imageSuggestion}, ${marisaPink}, Brazilian person working as ${jobTitle}, friendly smile, Marisa branding elements visible, diverse representation, age 25-35, high quality portrait, ultra high resolution`,
        
        `${marisaBase}, ${imageSuggestion}, ${marisaPink}, Brazilian professional in ${jobTitle} role, interacting with fashion retail environment, warm welcoming expression, age 30-40, photorealistic, ultra high resolution`,
        
        `${marisaBase}, ${imageSuggestion}, ${marisaPink}, Brazilian ${jobTitle} professional, fashion store background with pink brand colors, confident demeanor, age 25-45, professional portrait, ultra high resolution`
      ];
    }
    
    return [
      `${marisaBase}, happy Brazilian professional as ${jobTitle}, ${marisaPink}, smiling warmly, engaging with customers, Marisa store displays visible, diverse representation, age 25-35, photorealistic portrait, ultra high resolution`,
      
      `${marisaBase}, confident Brazilian ${jobTitle}, ${marisaPink}, organizing fashion displays, friendly professional demeanor, modern retail space, age 30-40, high quality photo, ultra high resolution`,
      
      `${marisaBase}, skilled Brazilian retail worker as ${jobTitle}, ${marisaPink}, helping customers, fashion merchandise background, welcoming smile, age 25-45, professional portrait, ultra high resolution`
    ];
  }

  // Para outros templates: priorizar sugestão da recrutadora
  if (imageSuggestion && imageSuggestion.trim()) {
    return [
      `Professional portrait photo, Brazilian person working as ${jobTitle}, ${imageSuggestion}, ${details.environment}, realistic ${details.tools} visible, ${details.style}, diverse representation, age 25-35, natural expression, high quality, ultra high resolution`,
      
      `High quality portrait, Brazilian professional in ${jobTitle} position, ${imageSuggestion}, realistic workplace setting: ${details.environment}, using ${details.tools}, ${details.style}, confident demeanor, age 30-40, photorealistic, ultra high resolution`,
      
      `Professional photo, Brazilian worker as ${jobTitle}, ${imageSuggestion}, authentic ${details.environment}, relevant ${details.tools} in scene, ${details.style}, friendly approachable look, age 25-45, realistic portrait, ultra high resolution`
    ];
  }

  // Prompts padrão sem sugestão: mais detalhados e específicos
  const requirementsContext = requirements.length > 0 
    ? `specialized in: ${requirements.slice(0, 2).join(', ')}` 
    : `experienced professional`;

  return [
    `Professional portrait, Brazilian person working as ${jobTitle} in ${sector} sector, ${requirementsContext}, realistic ${details.environment}, actively using ${details.tools}, ${details.style}, warm smile, diverse representation, age 25-35, photorealistic, ultra high resolution`,
    
    `High quality photo, confident Brazilian ${jobTitle} professional in ${sector}, ${requirementsContext}, authentic workplace: ${details.environment}, ${details.tools} visible in hands or nearby, ${details.style}, professional demeanor, age 30-40, realistic portrait, ultra high resolution`,
    
    `Realistic portrait, skilled Brazilian worker as ${jobTitle} in ${sector} field, ${requirementsContext}, genuine ${details.environment}, working with ${details.tools}, ${details.style}, friendly focused expression, age 25-45, photorealistic, ultra high resolution`
  ];
}