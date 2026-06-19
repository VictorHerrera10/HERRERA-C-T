/* Motor de respuestas de Codex — sin API externa, matching por palabras clave.
   Todo el conocimiento del negocio vive aquí. Agregar temas = nuevo bloque en KNOWLEDGE. */

export type CodexMessage = {
  id: string;
  from: "codex" | "user";
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaLabel2?: string;
  ctaHref2?: string;
};

type KnowledgeEntry = {
  keywords: string[];
  answer: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaLabel2?: string;
  ctaHref2?: string;
};

/* ── Base de conocimiento ─────────────────────────────────────────── */
const KNOWLEDGE: KnowledgeEntry[] = [
  /* Saludo / hola */
  {
    keywords: ["hola", "buenas", "buenos", "hi", "hey", "saludos", "buen dia", "buenas tardes", "buenas noches"],
    answer: "¡Hola! 👋 Soy Codex, el asistente de Herrera C&T. Estoy aquí para contarte todo sobre nuestros servicios, precios, cómo trabajamos y más. ¿Qué te gustaría saber?",
  },

  /* Servicios generales */
  {
    keywords: ["servicio", "servicios", "qué hacen", "que hacen", "que ofrecen", "qué ofrecen", "ofrecen", "ayudan", "hacen"],
    answer: "En Herrera C&T ofrecemos:\n\n🖥️ **Desarrollo de software a medida** — sistemas y apps web construidos para tu negocio exacto.\n\n☁️ **Infraestructura & Cloud** — servidores y nube siempre disponibles y seguros.\n\n🛠️ **Soporte TI continuo** — ayuda técnica cuando la necesitas, con tiempos de respuesta comprometidos.\n\n🌐 **Dominios & Hosting** — correos corporativos, hosting y dominios sin complicaciones.\n\n🔒 **Ciberseguridad** — protección real para tu operación.\n\n📊 **Consultoría estratégica** — te ayudamos a tomar mejores decisiones tecnológicas.\n\n¿Sobre cuál te cuento más? 😊",
  },

  /* Desarrollo de software */
  {
    keywords: ["desarrollo", "software", "sistema", "app", "aplicacion", "aplicación", "web", "sitio", "página", "pagina", "plataforma", "medida", "personalizado", "programar", "programacion"],
    answer: "🖥️ Construimos sistemas y aplicaciones web **exactamente a tu medida** — nada genérico.\n\nPodemos desarrollar desde un sitio corporativo hasta un sistema interno complejo: facturación, inventario, gestión de clientes, portales de servicio, lo que tu empresa necesite.\n\nTodo pensado para que sea fácil de usar, seguro y que crezca contigo. Sin tecnicismos innecesarios. 💪\n\n¿Tienes un proyecto en mente?",
    ctaLabel: "Pedir cotización",
    ctaHref: "#contacto",
  },

  /* Infraestructura / cloud / servidores */
  {
    keywords: ["infraestructura", "servidor", "servidores", "nube", "cloud", "hosting", "alojamiento", "vps", "aws", "azure", "deploy", "despliegue"],
    answer: "☁️ Nos encargamos de que tu plataforma esté **siempre disponible** — garantizamos 99.9% de uptime.\n\nGestionamos servidores, redes y nube: instalación, configuración, monitoreo y respuesta ante problemas. Tú te concentras en tu negocio y nosotros nos ocupamos de que todo funcione.\n\nSin sustos a medianoche. 🌙✅",
    ctaLabel: "Conversemos",
    ctaHref: "#contacto",
  },

  /* Dominios / hosting / correo */
  {
    keywords: ["dominio", "dominios", "correo", "correos", "corporativo", "email", "renovacion", "renovación", "dns", "cpanel"],
    answer: "🌐 Gestionamos todo lo de dominios y hosting:\n\n• Registro y renovación de dominios\n• Correos corporativos (nombre@tuempresa.com)\n• Hosting con respaldos automáticos\n• Configuración DNS sin dolores de cabeza\n\nSin recordatorios de vencimiento ni sorpresas: nosotros lo monitoreamos todo. 📧",
    ctaLabel: "Quiero saber más",
    ctaHref: "#contacto",
  },

  /* Ciberseguridad */
  {
    keywords: ["seguridad", "ciberseguridad", "hackeo", "hack", "virus", "malware", "proteccion", "protección", "vulnerabilidad", "contraseña", "firewall"],
    answer: "🔒 La seguridad no es un lujo, es una necesidad.\n\nAyudamos a proteger tu empresa con:\n• Auditorías de seguridad\n• Protección contra ataques\n• Políticas de acceso y contraseñas\n• Respaldo y recuperación ante incidentes\n\nMejor prevenir que lamentar. Si tienes dudas sobre la seguridad de tu operación, conversemos. 🛡️",
    ctaLabel: "Hablar de seguridad",
    ctaHref: "#contacto",
  },

  /* Soporte TI */
  {
    keywords: ["soporte", "ayuda", "asistencia", "mesa de ayuda", "helpdesk", "tecnico", "técnico", "ti", "it"],
    answer: "🛠️ Nuestro equipo de soporte TI responde cuando lo necesitas.\n\nOfrecemos:\n• Mesa de ayuda con tiempos de respuesta comprometidos\n• Atención a problemas técnicos del día a día\n• Un equipo que ya conoce tu empresa y tu infraestructura\n\n¿Tienes un problema ahora? Puedes abrir un ticket directamente desde nuestro portal. 👇",
    ctaLabel: "Ir al portal de soporte",
    ctaHref: "/soporte",
  },

  /* Precio / costo / presupuesto / cotización */
  {
    keywords: ["precio", "precios", "costo", "costos", "cuanto", "cuánto", "vale", "cuesta", "presupuesto", "tarifa", "cobran", "cobras", "cotizacion", "cotización", "cotizar"],
    answer: "💰 No manejamos tarifas fijas porque cada empresa tiene necesidades distintas.\n\nLo que sí te garantizamos es **total transparencia**: alcance, plazos y costos por escrito antes de empezar. Sin letra chica ni sorpresas a mitad del proyecto.\n\nPuedes pedir tu cotización y te respondemos dentro del mismo día hábil. 😊",
    ctaLabel: "Pedir cotización",
    ctaHref: "#contacto",
  },

  /* Cómo funciona / proceso / etapas */
  {
    keywords: ["como funciona", "cómo funciona", "proceso", "etapas", "pasos", "metodologia", "metodología", "cómo trabajan", "como trabajan", "forma de trabajar"],
    answer: "🔄 Nuestro proceso es simple y sin sorpresas:\n\n1️⃣ **Diagnóstico** — Entendemos tu operación antes de proponer nada.\n2️⃣ **Propuesta clara** — Alcance, plazos y costos por escrito.\n3️⃣ **Construcción** — Entregas reales que puedes revisar en el camino.\n4️⃣ **Operación continua** — Lanzar es el comienzo; te acompañamos a largo plazo.\n\nNada de promesas vacías. Todo documentado desde el día uno. ✅",
  },

  /* Quiénes somos / empresa */
  {
    keywords: ["quienes son", "quiénes son", "empresa", "consultora", "herrera", "experiencia", "trayectoria", "confianza", "sobre ustedes", "acerca"],
    answer: "🏢 Somos **Herrera Consulting & Technology**, una consultora especializada en tecnología para empresas.\n\nNacimos con una convicción simple: las empresas merecen un socio tecnológico que **hable claro, responda rápido y construya para durar**.\n\n✅ +10 años de experiencia\n✅ 99.9% de uptime garantizado\n✅ Soporte 24/7\n\nNo vendemos horas: asumimos resultados. 💪",
  },

  /* Contacto / comunicarse */
  {
    keywords: ["contacto", "contactar", "hablar", "llamar", "escribir", "correo", "whatsapp", "email", "comunicar", "comunicarse", "reunión", "reunion"],
    answer: "📬 Puedes contactarnos así:\n\n📧 **Email:** vr.herrera.c@gmail.com\n📍 **Atención:** remota y presencial\n\nEscríbenos y te respondemos dentro del mismo día hábil. También puedes llenar el formulario de contacto directamente. 😊",
    ctaLabel: "Ir al formulario",
    ctaHref: "#contacto",
  },

  /* Automatización */
  {
    keywords: ["automatizar", "automatizacion", "automatización", "automatico", "automático", "bot", "flujo", "workflow", "proceso automatico"],
    answer: "⚙️ ¡Esto nos encanta! Automatizamos procesos repetitivos para que tu equipo se enfoque en lo que importa.\n\nDesde reportes automáticos hasta integraciones entre sistemas, podemos ahorrarte muchas horas de trabajo manual. \n\n¿Tienes algún proceso en mente que quieras automatizar? Cuéntanos. 🚀",
    ctaLabel: "Conversemos",
    ctaHref: "#contacto",
  },

  /* Plazo / tiempo / cuánto demora */
  {
    keywords: ["plazo", "tiempo", "demora", "cuanto tarda", "cuánto tarda", "cuando", "cuándo", "rapido", "rápido", "urgente"],
    answer: "⏱️ Los plazos dependen del proyecto, pero siempre los acordamos por escrito antes de empezar.\n\nUn sitio corporativo puede estar listo en 2–3 semanas. Un sistema a medida puede tomar 1–3 meses. Para urgencias, evaluamos caso a caso.\n\nLo importante: nunca te dejamos sin información sobre el avance. 📅",
    ctaLabel: "Consultar mi caso",
    ctaHref: "#contacto",
  },

  /* Garantía / soporte post entrega */
  {
    keywords: ["garantia", "garantía", "post entrega", "después de", "despues", "mantenimiento", "soporte posterior", "si falla"],
    answer: "🛡️ No desaparecemos después de entregar.\n\nTodos nuestros proyectos incluyen soporte post-entrega y podemos armar un plan de mantenimiento continuo para que tu sistema evolucione con tu empresa.\n\nSi algo falla, estamos. Así de simple. ✅",
    ctaLabel: "Saber más",
    ctaHref: "#contacto",
  },

  /* Gracias */
  {
    keywords: ["gracias", "muchas gracias", "thank", "perfecto", "genial", "excelente", "ok", "listo", "entendido", "claro"],
    answer: "¡Con gusto! 😊 Si tienes más preguntas estoy aquí. Y si quieres avanzar con algo, el equipo de Herrera C&T está a un mensaje de distancia. 🚀",
    ctaLabel: "Contactar al equipo",
    ctaHref: "#contacto",
  },

  /* Fallback */
  {
    keywords: [],
    answer: "Hmm, no estoy seguro de poder responder eso con detalle. 🤔 Pero el equipo de Herrera C&T sí puede ayudarte. ¿Te conecto con ellos?",
    ctaLabel: "Hablar con el equipo",
    ctaHref: "#contacto",
    ctaLabel2: "Abrir ticket de soporte",
    ctaHref2: "/soporte",
  },
];

/* ── Saludo inicial ────────────────────────────────────────────────── */
export const CODEX_GREETING: Omit<CodexMessage, "id"> = {
  from: "codex",
  text: "¡Hola! 👋 Soy **Codex**, el asistente de **Herrera C&T**.\n\nEstoy aquí para responder tus dudas sobre nuestros servicios, precios y todo lo que necesites saber. ¿En qué te puedo ayudar hoy?",
};

export const QUICK_CHIPS = [
  { label: "Servicios 🖥️", query: "qué servicios ofrecen" },
  { label: "Cotización 💰", query: "quiero una cotización" },
  { label: "Cómo trabajan 🔄", query: "cómo trabajan" },
  { label: "Soporte 🛠️", query: "necesito soporte" },
];

/* ── Motor de matching ──────────────────────────────────────────────── */
export function getCodexResponse(input: string): Omit<CodexMessage, "id"> {
  const normalized = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¿?¡!.,]/g, "");

  let bestEntry: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE) {
    if (entry.keywords.length === 0) continue;
    let score = 0;
    for (const kw of entry.keywords) {
      if (normalized.includes(kw)) score += kw.length; // keywords más largas puntúan más
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  const match = bestScore > 0 ? bestEntry! : KNOWLEDGE[KNOWLEDGE.length - 1];

  return {
    from: "codex",
    text: match.answer,
    ctaLabel: match.ctaLabel,
    ctaHref: match.ctaHref,
    ctaLabel2: match.ctaLabel2,
    ctaHref2: match.ctaHref2,
  };
}
