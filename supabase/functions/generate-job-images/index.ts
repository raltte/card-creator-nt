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
  // Análise inteligente do cargo para determinar contexto
  const jobContext = analyzeJobContext(jobTitle);
  
  // Contextos detalhados por setor com ambientes e características específicas
  const sectorDetails: Record<string, { environment: string, tools: string, style: string, activities: string[] }> = {
    "Produção": {
      environment: "industrial factory floor, production line, manufacturing facility with machinery",
      tools: "safety helmet, safety vest, work gloves, manufacturing equipment",
      style: "industrial setting, bright overhead lighting, professional safety attire",
      activities: ["operating machinery", "quality inspection", "assembling products", "monitoring production line"]
    },
    "Indústria": {
      environment: "large industrial plant, heavy machinery area, factory floor with conveyor belts, steel and metal structures",
      tools: "hard hat, safety goggles, industrial gloves, heavy equipment, control panels",
      style: "industrial manufacturing setting, metal structures, safety equipment prominent, blue collar work environment",
      activities: ["operating industrial equipment", "welding or metalwork", "machinery maintenance", "quality control inspection", "supervising production"]
    },
    "Administração": {
      environment: "modern corporate office, desk with computer, organized workspace",
      tools: "laptop, documents, office supplies, organized files",
      style: "clean professional office, natural window lighting, business casual attire",
      activities: ["working on computer", "organizing documents", "attending meeting", "phone call"]
    },
    "Vendas": {
      environment: "retail store, sales floor, customer interaction area, product displays",
      tools: "tablet or smartphone, product samples, presentation materials",
      style: "dynamic sales environment, bright retail lighting, professional but approachable attire",
      activities: ["presenting products", "helping customer", "demonstrating items", "closing sale"]
    },
    "Tecnologia": {
      environment: "modern tech office, multiple monitors, collaborative workspace, tech lab",
      tools: "computer, coding screens, tech equipment, innovative tools",
      style: "contemporary tech setting, ambient lighting, casual professional tech attire",
      activities: ["coding on computer", "team collaboration", "debugging software", "tech meeting"]
    },
    "Saúde": {
      environment: "healthcare facility, medical office, clinical setting, hospital environment",
      tools: "medical equipment, stethoscope, clipboard, healthcare tools",
      style: "clean clinical setting, professional medical attire, bright clinical lighting",
      activities: ["patient care", "medical consultation", "health assessment", "clinical procedure"]
    },
    "Educação": {
      environment: "classroom, educational space, teaching environment, learning area",
      tools: "books, educational materials, whiteboard, teaching resources",
      style: "educational setting, natural lighting, professional educator attire",
      activities: ["teaching students", "presenting lesson", "helping student", "classroom interaction"]
    },
    "Logística": {
      environment: "warehouse, distribution center, loading dock, inventory area",
      tools: "forklift, scanner, pallet jack, logistics equipment",
      style: "large warehouse space, industrial lighting, work uniform with safety gear",
      activities: ["organizing inventory", "loading packages", "scanning items", "operating forklift"]
    },
    "Atendimento ao Cliente": {
      environment: "customer service desk, reception area, call center, service counter",
      tools: "headset, computer, phone, customer service tools",
      style: "welcoming service environment, professional friendly appearance",
      activities: ["assisting customer", "phone support", "solving problem", "greeting client"]
    },
    "Limpeza": {
      environment: "professional facility, clean workspace, maintenance area",
      tools: "professional cleaning equipment, organized supplies",
      style: "clean professional setting, work uniform, bright lighting",
      activities: ["cleaning surfaces", "organizing space", "maintenance work", "sanitation duties"]
    },
    "Manutenção": {
      environment: "technical workshop, maintenance facility, equipment room",
      tools: "tools, technical equipment, maintenance gear",
      style: "technical workspace, work uniform, industrial lighting",
      activities: ["repairing equipment", "technical inspection", "using power tools", "preventive maintenance"]
    }
  };

  const details = sectorDetails[sector] || {
    environment: "professional workplace, modern office setting",
    tools: "work equipment, professional tools",
    style: "professional environment, business attire",
    activities: ["working professionally", "collaborating with team", "focused on task"]
  };

  // Selecionar atividade aleatória para variação
  const randomActivity = (activities: string[]) => activities[Math.floor(Math.random() * activities.length)];

  // Prompts específicos para Marisa
  if (clientTemplate === 'marisa') {
    const marisaBase = "Professional photo in Marisa fashion retail store, modern retail environment with clothing displays and fashion merchandise";
    const marisaPink = "wearing professional attire with visible pink clothing item or accessory (pink blouse, pink shirt, pink scarf, or pink jacket)";
    
    if (imageSuggestion && imageSuggestion.trim()) {
      return [
        `${marisaBase}, ${imageSuggestion}, ${marisaPink}, Brazilian person working as ${jobTitle}, ${jobContext.action}, friendly smile, Marisa branding elements visible, diverse representation, age 25-35, high quality portrait, ultra high resolution`,
        
        `${marisaBase}, ${imageSuggestion}, ${marisaPink}, Brazilian professional in ${jobTitle} role, ${jobContext.alternateAction}, warm welcoming expression, age 30-40, photorealistic, ultra high resolution`,
        
        `${marisaBase}, ${imageSuggestion}, ${marisaPink}, Brazilian ${jobTitle} professional, ${jobContext.setting}, confident demeanor, age 25-45, professional portrait, ultra high resolution`
      ];
    }
    
    return [
      `${marisaBase}, happy Brazilian professional as ${jobTitle}, ${marisaPink}, ${jobContext.action}, Marisa store displays visible, diverse representation, age 25-35, photorealistic portrait, ultra high resolution`,
      
      `${marisaBase}, confident Brazilian ${jobTitle}, ${marisaPink}, ${jobContext.alternateAction}, modern retail space, age 30-40, high quality photo, ultra high resolution`,
      
      `${marisaBase}, skilled Brazilian retail worker as ${jobTitle}, ${marisaPink}, ${jobContext.setting}, welcoming smile, age 25-45, professional portrait, ultra high resolution`
    ];
  }

  // Para outros templates: priorizar sugestão da recrutadora
  if (imageSuggestion && imageSuggestion.trim()) {
    return [
      `Professional portrait photo, Brazilian person working as ${jobTitle}, ${imageSuggestion}, ${details.environment}, ${randomActivity(details.activities)}, realistic ${details.tools} visible, ${details.style}, diverse representation, age 25-35, natural expression, high quality, ultra high resolution`,
      
      `High quality portrait, Brazilian professional in ${jobTitle} position, ${imageSuggestion}, realistic workplace setting: ${details.environment}, ${randomActivity(details.activities)}, ${details.style}, confident demeanor, age 30-40, photorealistic, ultra high resolution`,
      
      `Professional photo, Brazilian worker as ${jobTitle}, ${imageSuggestion}, authentic ${details.environment}, ${randomActivity(details.activities)}, ${details.style}, friendly approachable look, age 25-45, realistic portrait, ultra high resolution`
    ];
  }

  // Prompts padrão sem sugestão: mais detalhados e específicos ao cargo
  const requirementsContext = requirements.length > 0 
    ? `specialized in: ${requirements.slice(0, 2).join(', ')}` 
    : `experienced professional`;

  return [
    `Professional portrait, Brazilian person working as ${jobTitle} in ${sector} sector, ${jobContext.action}, ${requirementsContext}, realistic ${details.environment}, actively using ${details.tools}, ${details.style}, warm smile, diverse representation, age 25-35, photorealistic, ultra high resolution`,
    
    `High quality photo, confident Brazilian ${jobTitle} professional in ${sector}, ${jobContext.alternateAction}, ${requirementsContext}, authentic workplace: ${details.environment}, ${randomActivity(details.activities)}, ${details.style}, professional demeanor, age 30-40, realistic portrait, ultra high resolution`,
    
    `Realistic portrait, skilled Brazilian worker as ${jobTitle} in ${sector} field, ${jobContext.setting}, ${requirementsContext}, genuine ${details.environment}, ${randomActivity(details.activities)}, ${details.style}, friendly focused expression, age 25-45, photorealistic, ultra high resolution`
  ];
}

// Análise inteligente do cargo para determinar ações e contextos específicos
function analyzeJobContext(jobTitle: string): { action: string, alternateAction: string, setting: string } {
  const jobLower = jobTitle.toLowerCase();
  
  // Cargos de liderança/gestão
  if (jobLower.includes('gerente') || jobLower.includes('coordenador') || jobLower.includes('supervisor') || jobLower.includes('líder') || jobLower.includes('diretor') || jobLower.includes('chefe')) {
    return {
      action: "leading team meeting or giving directions to staff",
      alternateAction: "reviewing reports and making strategic decisions",
      setting: "in leadership position, overseeing team activities"
    };
  }
  
  // Cargos técnicos/engenharia
  if (jobLower.includes('técnico') || jobLower.includes('engenheiro') || jobLower.includes('mecânico') || jobLower.includes('eletricista') || jobLower.includes('soldador')) {
    return {
      action: "performing technical work with specialized equipment",
      alternateAction: "analyzing technical diagrams or blueprints",
      setting: "in technical environment with specialized tools and equipment"
    };
  }
  
  // Cargos operacionais/produção
  if (jobLower.includes('operador') || jobLower.includes('auxiliar de produção') || jobLower.includes('montador') || jobLower.includes('alimentador')) {
    return {
      action: "operating industrial machinery with safety equipment",
      alternateAction: "inspecting products on production line",
      setting: "on factory floor near production equipment"
    };
  }
  
  // Cargos de atendimento/vendas
  if (jobLower.includes('vendedor') || jobLower.includes('atendente') || jobLower.includes('consultor') || jobLower.includes('balconista') || jobLower.includes('caixa')) {
    return {
      action: "helping customer with friendly smile",
      alternateAction: "demonstrating product to interested client",
      setting: "at service counter or sales floor assisting customers"
    };
  }
  
  // Cargos administrativos
  if (jobLower.includes('administrativo') || jobLower.includes('secretário') || jobLower.includes('recepcionista') || jobLower.includes('assistente') || jobLower.includes('analista')) {
    return {
      action: "working on computer organizing documents",
      alternateAction: "attending to phone call professionally",
      setting: "at organized desk in modern office environment"
    };
  }
  
  // Cargos de logística/armazém
  if (jobLower.includes('estoquista') || jobLower.includes('almoxarife') || jobLower.includes('conferente') || jobLower.includes('separador') || jobLower.includes('motorista')) {
    return {
      action: "organizing inventory in warehouse",
      alternateAction: "scanning packages with handheld device",
      setting: "in large warehouse environment with shelving"
    };
  }
  
  // Cargos de limpeza/serviços gerais
  if (jobLower.includes('limpeza') || jobLower.includes('zelador') || jobLower.includes('serviços gerais') || jobLower.includes('faxineiro') || jobLower.includes('copeiro')) {
    return {
      action: "performing cleaning duties professionally",
      alternateAction: "maintaining clean organized environment",
      setting: "in clean professional facility"
    };
  }
  
  // Cargos de alimentação/cozinha
  if (jobLower.includes('cozinheiro') || jobLower.includes('padeiro') || jobLower.includes('confeiteiro') || jobLower.includes('churrasqueiro') || jobLower.includes('auxiliar de cozinha')) {
    return {
      action: "preparing food in professional kitchen",
      alternateAction: "cooking with specialized equipment",
      setting: "in commercial kitchen with professional cooking equipment"
    };
  }
  
  // Cargos de construção civil
  if (jobLower.includes('pedreiro') || jobLower.includes('pintor') || jobLower.includes('eletricista') || jobLower.includes('encanador') || jobLower.includes('carpinteiro') || jobLower.includes('servente')) {
    return {
      action: "performing construction work with proper safety gear",
      alternateAction: "using construction tools and equipment",
      setting: "at construction site with building materials"
    };
  }
  
  // Padrão para cargos não mapeados
  return {
    action: "performing professional duties with dedication",
    alternateAction: "collaborating with colleagues effectively",
    setting: "in appropriate professional work environment"
  };
}