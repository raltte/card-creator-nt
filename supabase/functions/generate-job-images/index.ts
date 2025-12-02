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
  
  // Diferentes poses/ângulos para variedade
  const poses = [
    "medium shot, front view, looking at camera with confident smile",
    "three-quarter view, candid working pose, natural expression",
    "slightly low angle, dynamic working pose, determined look"
  ];
  
  // Diferentes iluminações para variedade
  const lightings = [
    "warm natural lighting from side, soft shadows",
    "bright overhead industrial lighting, clear visibility",
    "dramatic rim lighting, professional studio quality"
  ];
  
  // Diferentes idades para diversidade
  const ages = ["Brazilian man age 28-32", "Brazilian woman age 30-38", "Brazilian person age 35-45"];
  
  // === SE TEM SUGESTÃO DO USUÁRIO - PRIORIDADE MÁXIMA ===
  if (imageSuggestion && imageSuggestion.trim()) {
    console.log('Using user suggestion:', imageSuggestion);
    
    // Marisa com sugestão
    if (clientTemplate === 'marisa') {
      return [
        `IMPORTANT: ${imageSuggestion}. Professional photo of ${ages[0]} working as ${jobTitle} inside Marisa fashion retail store. Wearing pink clothing (pink blouse or pink vest). ${poses[0]}, ${lightings[0]}. Background shows clothing racks and fashion displays. Photorealistic, 8K quality, ultra detailed.`,
        
        `IMPORTANT: ${imageSuggestion}. Portrait of ${ages[1]} as ${jobTitle} in Marisa store environment. Must wear pink apparel item. ${poses[1]}, ${lightings[1]}. Visible store merchandise and displays. High resolution professional photography.`,
        
        `IMPORTANT: ${imageSuggestion}. ${ages[2]} employed as ${jobTitle} at Marisa retail location. Pink uniform or pink clothing accessory required. ${poses[2]}, ${lightings[2]}. Fashion retail setting clearly visible. Commercial quality portrait.`
      ];
    }
    
    // Outros templates com sugestão
    return [
      `CRITICAL INSTRUCTION: ${imageSuggestion}. Professional photograph of ${ages[0]} working as ${jobTitle}. Environment: ${workContext.environment}. Wearing: ${workContext.attire}. Activity: ${workContext.action}. ${poses[0]}, ${lightings[0]}. Photorealistic, 8K quality, highly detailed, professional corporate photography.`,
      
      `CRITICAL INSTRUCTION: ${imageSuggestion}. Portrait of ${ages[1]} in role of ${jobTitle}. Setting: ${workContext.environment}. Dressed in: ${workContext.attire}. Doing: ${workContext.alternateAction}. ${poses[1]}, ${lightings[1]}. Ultra high resolution, realistic lighting, detailed textures.`,
      
      `CRITICAL INSTRUCTION: ${imageSuggestion}. ${ages[2]} as ${jobTitle}. Location: ${workContext.setting}. Equipment visible: ${workContext.tools}. Clothing: ${workContext.attire}. ${poses[2]}, ${lightings[2]}. Professional quality, sharp focus, authentic workplace atmosphere.`
    ];
  }
  
  // === MARISA SEM SUGESTÃO ===
  if (clientTemplate === 'marisa') {
    return [
      `Professional portrait of ${ages[0]} working as ${jobTitle} inside Marisa fashion retail store. MUST be wearing pink clothing item (pink blouse, pink polo shirt, or pink vest). ${poses[0]}, ${lightings[0]}. Background shows colorful clothing racks, fashion merchandise, and store displays. Interacting with products or customers. Friendly welcoming expression. Photorealistic, 8K quality, commercial photography style.`,
      
      `Candid workplace photo of ${ages[1]} employed as ${jobTitle} at Marisa store. Required: pink apparel (shirt, blouse, or uniform with pink). ${poses[1]}, ${lightings[1]}. Store environment with women's fashion visible, organized displays, bright retail atmosphere. Natural genuine smile. High resolution, professional retail photography.`,
      
      `Dynamic portrait of ${ages[2]} in ${jobTitle} position at Marisa retail location. Essential: wearing pink colored clothing piece prominently visible. ${poses[2]}, ${lightings[2]}. Fashion store setting with mannequins, clothing racks, promotional displays visible. Engaged in work activity. Commercial quality, sharp focus, vibrant colors.`
    ];
  }
  
  // === PROMPTS PADRÃO - MUITO DETALHADOS E VARIADOS ===
  return [
    `Highly detailed professional photograph of ${ages[0]} working as ${jobTitle} in ${sector} sector. ENVIRONMENT: ${workContext.environment}. WEARING: ${workContext.attire}. ACTIVITY: ${workContext.action}. TOOLS/EQUIPMENT: ${workContext.tools}. ${poses[0]}, ${lightings[0]}. Photorealistic quality, 8K resolution, authentic workplace setting, genuine expression, professional corporate photography style. The person should look competent and engaged in their work.`,
    
    `Realistic workplace portrait of ${ages[1]} employed as ${jobTitle}. SETTING: ${workContext.setting}. DRESS CODE: ${workContext.attire}. TASK: ${workContext.alternateAction}. VISIBLE EQUIPMENT: ${workContext.tools}. ${poses[1]}, ${lightings[1]}. Ultra high definition, sharp focus on subject, blurred background depth of field, commercial photography quality. Natural authentic pose showing expertise in their role.`,
    
    `Professional headshot style photo of ${ages[2]} as ${jobTitle} in ${sector} field. LOCATION DETAILS: ${workContext.environment}. UNIFORM/CLOTHING: ${workContext.attire}. WORK CONTEXT: ${workContext.setting}. ${poses[2]}, ${lightings[2]}. Crisp high resolution image, realistic skin texture, appropriate workplace background, confident professional demeanor. Should clearly represent the ${sector} industry and ${jobTitle} role.`
  ];
}

// Determina o contexto de trabalho baseado no cargo e setor - CRÍTICO para ambiente correto
function determineWorkContext(jobTitle: string, sector: string): { 
  environment: string, 
  action: string, 
  alternateAction: string, 
  setting: string, 
  attire: string, 
  tools: string 
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
      environment: "inside industrial factory floor with machinery, conveyor belts, and metal structures visible, industrial lighting, NO OFFICE",
      action: "operating industrial machinery or inspecting products on production line",
      alternateAction: "checking quality of manufactured parts near conveyor belt",
      setting: "standing near large industrial equipment on factory floor",
      attire: "safety helmet, high-visibility vest, safety glasses, work uniform",
      tools: "industrial machinery, control panels, production equipment"
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
      environment: "inside large warehouse with high shelving racks full of boxes and packages, concrete floor, NO OFFICE",
      action: "organizing boxes on warehouse shelves or scanning packages with handheld device",
      alternateAction: "operating forklift or moving pallets in warehouse aisle",
      setting: "in warehouse surrounded by inventory shelves and cardboard boxes",
      attire: "work uniform, safety shoes, high-visibility vest",
      tools: "pallet jack, barcode scanner, forklift, inventory boxes"
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
      environment: "in industrial maintenance area or technical workshop with equipment and tools visible, NO OFFICE",
      action: "repairing machinery or performing electrical work with tools",
      alternateAction: "inspecting equipment with diagnostic tools in hand",
      setting: "near industrial equipment being repaired or maintained",
      attire: "work uniform, safety glasses, tool belt, work gloves",
      tools: "wrenches, screwdrivers, multimeter, power tools, toolbox"
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
      environment: "at construction site with building structure, scaffolding, and construction materials visible, outdoor, NO OFFICE",
      action: "working on building construction with tools and materials",
      alternateAction: "measuring or installing building components",
      setting: "on construction site with concrete, bricks, and scaffolding around",
      attire: "hard hat, work boots, work clothes, safety vest",
      tools: "construction tools, trowel, level, power drill, cement mixer"
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
      environment: "in clean commercial building hallway or common area with professional cleaning equipment, NO OFFICE DESK",
      action: "cleaning surfaces with professional cleaning equipment",
      alternateAction: "organizing cleaning supplies and maintaining cleanliness",
      setting: "in professional facility performing cleaning duties",
      attire: "clean work uniform, professional cleaning attire",
      tools: "cleaning cart, mop, professional cleaning supplies"
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
      environment: "in professional commercial kitchen with stainless steel equipment, stoves, and food prep areas, NO OFFICE",
      action: "preparing food or cooking in commercial kitchen",
      alternateAction: "plating dishes or organizing kitchen station",
      setting: "at cooking station in professional kitchen environment",
      attire: "chef hat or cap, white chef coat, apron, kitchen uniform",
      tools: "pots and pans, cooking utensils, stove, cutting board"
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
      environment: "inside retail store with product shelves and displays visible, store lighting, NO OFFICE",
      action: "helping customer or presenting products on sales floor",
      alternateAction: "organizing merchandise on store shelves",
      setting: "at sales counter or among product displays in store",
      attire: "professional retail uniform, name badge, clean appearance",
      tools: "product displays, cash register, tablet or smartphone"
    };
  }
  
  // === CARGOS DE MOTORISTA/TRANSPORTE ===
  if (
    jobLower.includes('motorista') || 
    jobLower.includes('entregador') || 
    jobLower.includes('motoboy')
  ) {
    return {
      environment: "near delivery truck or vehicle in loading area or parking lot, outdoor, NO OFFICE",
      action: "loading packages into delivery vehicle or checking delivery route",
      alternateAction: "organizing cargo in truck or signing delivery documents",
      setting: "standing beside delivery vehicle or truck",
      attire: "driver uniform, comfortable work clothes",
      tools: "delivery truck, packages, delivery clipboard, vehicle keys"
    };
  }
  
  // === CARGOS DE SEGURANÇA ===
  if (
    jobLower.includes('vigilante') || 
    jobLower.includes('porteiro') || 
    jobLower.includes('segurança')
  ) {
    return {
      environment: "at building entrance, security post, or monitoring station, NO OFFICE DESK",
      action: "monitoring entrance or checking credentials",
      alternateAction: "patrolling facility or watching security monitors",
      setting: "at security checkpoint or entrance gate",
      attire: "security uniform, professional guard attire",
      tools: "radio communicator, monitoring screens, clipboard"
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
      environment: "in modern office space with desk, computer, and organized workspace",
      action: "working on computer or organizing documents at desk",
      alternateAction: "attending to phone call or reviewing paperwork",
      setting: "at organized desk in professional office environment",
      attire: "business casual attire, professional office clothing",
      tools: "computer, documents, office supplies, telephone"
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
    // Liderança industrial vs administrativa
    if (sectorLower.includes('produção') || sectorLower.includes('indústria') || sectorLower.includes('logística')) {
      return {
        environment: "on factory floor or warehouse supervising team, industrial setting visible, NO OFFICE",
        action: "directing team members or inspecting production process",
        alternateAction: "reviewing production metrics with team on factory floor",
        setting: "standing among workers in industrial environment",
        attire: "safety helmet, professional work attire, clipboard",
        tools: "clipboard, radio, tablet for production tracking"
      };
    }
    return {
      environment: "in modern office or meeting room with professional decor",
      action: "leading team meeting or reviewing reports",
      alternateAction: "discussing strategy with team members",
      setting: "in meeting room or office with leadership presence",
      attire: "business professional attire",
      tools: "laptop, presentation materials, meeting documents"
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
      environment: "in healthcare facility, hospital corridor, or clinical setting with medical equipment",
      action: "attending to patient or reviewing medical charts",
      alternateAction: "preparing medical equipment or medication",
      setting: "in clinical environment with medical equipment visible",
      attire: "medical scrubs, lab coat, stethoscope, healthcare uniform",
      tools: "medical equipment, stethoscope, clipboard, medical supplies"
    };
  }
  
  // === PADRÃO - baseado no setor ===
  // Se não identificou o cargo, usa o setor para decidir
  if (sectorLower.includes('produção') || sectorLower.includes('indústria')) {
    return {
      environment: "inside industrial facility with machinery and equipment visible, NO OFFICE",
      action: "working with industrial equipment",
      alternateAction: "inspecting or operating machinery",
      setting: "on factory floor or industrial workspace",
      attire: "safety equipment, work uniform, protective gear",
      tools: "industrial equipment, safety gear"
    };
  }
  
  // Fallback genérico - NÃO usar escritório por padrão
  return {
    environment: "in professional workplace appropriate for the job role",
    action: "performing job duties with professionalism",
    alternateAction: "working efficiently on assigned tasks",
    setting: "in suitable work environment for the position",
    attire: "appropriate work attire for the role",
    tools: "relevant work equipment and tools"
  };
}