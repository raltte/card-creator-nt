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
  console.log('Generating prompts for:', { jobTitle, sector, imageSuggestion, clientTemplate });
  
  const workContext = determineWorkContext(jobTitle, sector);
  
  // Pessoas brasileiras diversas
  const subjects = [
    "Brazilian man, age 30",
    "Brazilian woman, age 32", 
    "Brazilian person, age 35"
  ];
  
  // Instrução base para imagens LIMPAS
  const cleanStyle = "clean simple background, solid color or soft gradient backdrop, studio lighting, no text, no logos, no clutter, professional portrait style, sharp focus on person";
  
  // === SE TEM SUGESTÃO DO USUÁRIO - PRIORIDADE MÁXIMA ===
  if (imageSuggestion && imageSuggestion.trim()) {
    console.log('Using user suggestion:', imageSuggestion);
    
    // Marisa com sugestão
    if (clientTemplate === 'marisa') {
      return [
        `${subjects[0]} as ${jobTitle}. USER REQUEST: ${imageSuggestion}. Wearing pink shirt. ${cleanStyle}, hint of retail store in blurred background. Friendly smile.`,
        `${subjects[1]} working as ${jobTitle}. USER REQUEST: ${imageSuggestion}. Pink clothing visible. ${cleanStyle}, subtle fashion retail context. Confident expression.`,
        `${subjects[2]} employed as ${jobTitle}. USER REQUEST: ${imageSuggestion}. Pink uniform element. ${cleanStyle}, minimal store background. Professional demeanor.`
      ];
    }
    
    // Outros templates com sugestão
    return [
      `${subjects[0]} as ${jobTitle}. USER REQUEST: ${imageSuggestion}. Wearing ${workContext.attire}. ${cleanStyle}, subtle ${workContext.simpleBackground}. Confident smile.`,
      `${subjects[1]} working as ${jobTitle}. USER REQUEST: ${imageSuggestion}. ${workContext.attire}. ${cleanStyle}, hint of ${workContext.simpleBackground}. Natural expression.`,
      `${subjects[2]} employed as ${jobTitle}. USER REQUEST: ${imageSuggestion}. ${workContext.attire}. ${cleanStyle}, minimal ${workContext.simpleBackground}. Professional look.`
    ];
  }
  
  // === MARISA SEM SUGESTÃO ===
  if (clientTemplate === 'marisa') {
    return [
      `${subjects[0]} as ${jobTitle} in retail. Wearing pink polo shirt or pink blouse. ${cleanStyle}, soft blurred fashion store background. Friendly welcoming smile, professional portrait.`,
      `${subjects[1]} working as ${jobTitle}. Pink clothing prominent. ${cleanStyle}, subtle retail environment hint. Confident warm expression.`,
      `${subjects[2]} employed as ${jobTitle}. Pink uniform shirt visible. ${cleanStyle}, minimal store background. Natural professional demeanor.`
    ];
  }
  
  // === PROMPTS PADRÃO - LIMPOS E SIMPLES ===
  return [
    `${subjects[0]} as ${jobTitle}. Wearing ${workContext.attire}. ${cleanStyle}, subtle ${workContext.simpleBackground}. Confident professional expression, natural pose.`,
    `${subjects[1]} working as ${jobTitle}. ${workContext.attire}. ${cleanStyle}, hint of ${workContext.simpleBackground}. Friendly smile, engaged look.`,
    `${subjects[2]} employed as ${jobTitle}. ${workContext.attire}. ${cleanStyle}, minimal ${workContext.simpleBackground}. Determined professional expression.`
  ];
}

// Determina o contexto de trabalho baseado no cargo e setor - CRÍTICO para ambiente correto
function determineWorkContext(jobTitle: string, sector: string): { 
  environment: string, 
  action: string, 
  alternateAction: string, 
  setting: string, 
  attire: string, 
  tools: string,
  simpleBackground: string
} {
  const jobLower = jobTitle.toLowerCase();
  const sectorLower = sector.toLowerCase();
  
  // === CARGOS INDUSTRIAIS/PRODUÇÃO - NUNCA ESCRITÓRIO ===
  if (
    jobLower.includes('operador') || 
    jobLower.includes('produção') || 
    jobLower.includes('montador') || 
    jobLower.includes('alimentador') ||
    jobLower.includes('soldador') ||
    jobLower.includes('torneiro') ||
    jobLower.includes('fresador') ||
    jobLower.includes('prensista') ||
    jobLower.includes('ajudante de produção') ||
    jobLower.includes('auxiliar de produção') ||
    sectorLower.includes('produção') ||
    sectorLower.includes('indústria')
  ) {
    return {
      environment: "industrial factory floor",
      action: "operating machinery",
      alternateAction: "inspecting products",
      setting: "factory floor",
      attire: "safety helmet, high-visibility vest, safety glasses",
      tools: "industrial machinery",
      simpleBackground: "industrial gray gradient"
    };
  }
  
  // === CARGOS DE ESTOQUE/LOGÍSTICA - ARMAZÉM ===
  if (
    jobLower.includes('estoquista') || 
    jobLower.includes('almoxarife') || 
    jobLower.includes('conferente') ||
    jobLower.includes('separador') ||
    jobLower.includes('empilhadeira') ||
    jobLower.includes('logística') ||
    jobLower.includes('expedição') ||
    jobLower.includes('recebimento') ||
    sectorLower.includes('logística')
  ) {
    return {
      environment: "warehouse",
      action: "organizing inventory",
      alternateAction: "scanning packages",
      setting: "warehouse",
      attire: "work uniform, high-visibility vest",
      tools: "scanner, boxes",
      simpleBackground: "warehouse beige gradient"
    };
  }
  
  // === CARGOS DE MANUTENÇÃO - ÁREA TÉCNICA ===
  if (
    jobLower.includes('manutenção') || 
    jobLower.includes('mecânico') || 
    jobLower.includes('eletricista') ||
    jobLower.includes('técnico') ||
    jobLower.includes('encanador') ||
    jobLower.includes('serralheiro') ||
    sectorLower.includes('manutenção')
  ) {
    return {
      environment: "technical workshop",
      action: "repairing equipment",
      alternateAction: "using diagnostic tools",
      setting: "maintenance area",
      attire: "work uniform, safety glasses, tool belt",
      tools: "tools, multimeter",
      simpleBackground: "blue-gray workshop gradient"
    };
  }
  
  // === CARGOS DE CONSTRUÇÃO CIVIL - OBRA ===
  if (
    jobLower.includes('pedreiro') || 
    jobLower.includes('pintor') || 
    jobLower.includes('carpinteiro') ||
    jobLower.includes('servente') ||
    jobLower.includes('mestre de obras') ||
    jobLower.includes('encarregado de obra') ||
    jobLower.includes('azulejista') ||
    jobLower.includes('gesseiro')
  ) {
    return {
      environment: "construction site",
      action: "building construction",
      alternateAction: "measuring components",
      setting: "construction area",
      attire: "hard hat, work boots, safety vest",
      tools: "construction tools",
      simpleBackground: "outdoor construction gradient"
    };
  }
  
  // === CARGOS DE LIMPEZA - AMBIENTE GERAL ===
  if (
    jobLower.includes('limpeza') || 
    jobLower.includes('faxineiro') || 
    jobLower.includes('zelador') ||
    jobLower.includes('copeiro') ||
    jobLower.includes('serviços gerais') ||
    sectorLower.includes('limpeza')
  ) {
    return {
      environment: "commercial building",
      action: "cleaning surfaces",
      alternateAction: "organizing supplies",
      setting: "clean facility",
      attire: "clean work uniform",
      tools: "cleaning supplies",
      simpleBackground: "clean white-blue gradient"
    };
  }
  
  // === CARGOS DE COZINHA/ALIMENTAÇÃO - COZINHA ===
  if (
    jobLower.includes('cozinheiro') || 
    jobLower.includes('auxiliar de cozinha') || 
    jobLower.includes('padeiro') ||
    jobLower.includes('confeiteiro') ||
    jobLower.includes('churrasqueiro') ||
    jobLower.includes('copeiro') ||
    jobLower.includes('garçom') ||
    sectorLower.includes('alimentação')
  ) {
    return {
      environment: "commercial kitchen",
      action: "preparing food",
      alternateAction: "cooking",
      setting: "kitchen station",
      attire: "chef hat, white chef coat, apron",
      tools: "cooking utensils",
      simpleBackground: "stainless steel kitchen gradient"
    };
  }
  
  // === CARGOS DE VENDAS/VAREJO - LOJA ===
  if (
    jobLower.includes('vendedor') || 
    jobLower.includes('balconista') || 
    jobLower.includes('atendente') ||
    jobLower.includes('caixa') ||
    jobLower.includes('promotor') ||
    sectorLower.includes('vendas') ||
    sectorLower.includes('varejo') ||
    sectorLower.includes('atendimento')
  ) {
    return {
      environment: "retail store",
      action: "helping customer",
      alternateAction: "organizing products",
      setting: "sales floor",
      attire: "professional retail uniform",
      tools: "tablet, products",
      simpleBackground: "bright retail store gradient"
    };
  }
  
  // === CARGOS DE MOTORISTA/TRANSPORTE ===
  if (
    jobLower.includes('motorista') || 
    jobLower.includes('entregador') || 
    jobLower.includes('motoboy')
  ) {
    return {
      environment: "loading area",
      action: "loading vehicle",
      alternateAction: "checking delivery route",
      setting: "near vehicle",
      attire: "driver uniform",
      tools: "delivery truck, packages",
      simpleBackground: "outdoor transportation gradient"
    };
  }
  
  // === CARGOS DE SEGURANÇA ===
  if (
    jobLower.includes('vigilante') || 
    jobLower.includes('porteiro') || 
    jobLower.includes('segurança')
  ) {
    return {
      environment: "security post",
      action: "monitoring entrance",
      alternateAction: "patrolling facility",
      setting: "security checkpoint",
      attire: "security uniform",
      tools: "radio communicator",
      simpleBackground: "dark professional gradient"
    };
  }
  
  // === CARGOS ADMINISTRATIVOS - ESCRITÓRIO (único caso) ===
  if (
    jobLower.includes('administrativo') || 
    jobLower.includes('secretário') || 
    jobLower.includes('secretária') ||
    jobLower.includes('recepcionista') ||
    jobLower.includes('assistente') ||
    jobLower.includes('analista') ||
    jobLower.includes('auxiliar administrativo') ||
    jobLower.includes('escritório') ||
    jobLower.includes('financeiro') ||
    jobLower.includes('contábil') ||
    jobLower.includes('rh') ||
    jobLower.includes('recursos humanos') ||
    sectorLower.includes('administração') ||
    sectorLower.includes('financeiro')
  ) {
    return {
      environment: "modern office",
      action: "working on computer",
      alternateAction: "reviewing documents",
      setting: "office desk",
      attire: "business casual attire",
      tools: "computer, documents",
      simpleBackground: "soft office blue gradient"
    };
  }
  
  // === CARGOS DE LIDERANÇA/GESTÃO ===
  if (
    jobLower.includes('gerente') || 
    jobLower.includes('supervisor') || 
    jobLower.includes('coordenador') ||
    jobLower.includes('líder') ||
    jobLower.includes('encarregado') ||
    jobLower.includes('chefe')
  ) {
    if (sectorLower.includes('produção') || sectorLower.includes('indústria') || sectorLower.includes('logística')) {
      return {
        environment: "factory floor supervision",
        action: "directing team",
        alternateAction: "reviewing production",
        setting: "industrial supervision",
        attire: "safety helmet, professional attire",
        tools: "clipboard, tablet",
        simpleBackground: "industrial leadership gradient"
      };
    }
    return {
      environment: "meeting room",
      action: "leading meeting",
      alternateAction: "reviewing reports",
      setting: "professional office",
      attire: "business professional attire",
      tools: "laptop, documents",
      simpleBackground: "corporate blue gradient"
    };
  }
  
  // === CARGOS DE SAÚDE ===
  if (
    jobLower.includes('enfermeiro') || 
    jobLower.includes('técnico de enfermagem') || 
    jobLower.includes('auxiliar de enfermagem') ||
    jobLower.includes('médico') ||
    jobLower.includes('farmacêutico') ||
    sectorLower.includes('saúde')
  ) {
    return {
      environment: "healthcare facility",
      action: "patient care",
      alternateAction: "preparing equipment",
      setting: "clinical environment",
      attire: "medical scrubs, lab coat",
      tools: "stethoscope, medical supplies",
      simpleBackground: "clinical white-green gradient"
    };
  }
  
  // === PADRÃO - baseado no setor ===
  if (sectorLower.includes('produção') || sectorLower.includes('indústria')) {
    return {
      environment: "industrial facility",
      action: "working with equipment",
      alternateAction: "operating machinery",
      setting: "industrial workspace",
      attire: "safety equipment, work uniform",
      tools: "industrial equipment",
      simpleBackground: "industrial gray gradient"
    };
  }
  
  // Fallback genérico
  return {
    environment: "professional workplace",
    action: "performing duties",
    alternateAction: "working on tasks",
    setting: "work environment",
    attire: "appropriate work attire",
    tools: "work equipment",
    simpleBackground: "neutral professional gradient"
  };
}