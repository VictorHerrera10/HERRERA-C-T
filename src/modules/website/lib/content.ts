import { supabase } from "@/modules/shared/lib/supabase";

/* ── Tipos de contenido editable ─────────────────────────── */

export type Stat = { value: string; label: string };

export type HeroContent = {
  eyebrow: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  stats: Stat[];
};

export type MarqueeContent = { items: string[] };

export type AboutContent = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  bullets: string[];
};

export type ProcessStep = { title: string; description: string };

export type ProcessContent = {
  eyebrow: string;
  title: string;
  steps: ProcessStep[];
};

export type ContactContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  whatsapp: string;
  location: string;
};

export type FooterContent = { tagline: string; copyright: string };

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: "burgundy" | "azul" | "gold" | "esmeralda";
  sort_order: number;
  published: boolean;
};

export type Testimonial = {
  id: string;
  quote: string;
  author: string;
  role: string;
  sort_order: number;
  published: boolean;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  link: string;
  sort_order: number;
  published: boolean;
};

export type SiteContent = {
  hero: HeroContent;
  marquee: MarqueeContent;
  about: AboutContent;
  process: ProcessContent;
  contact: ContactContent;
  footer: FooterContent;
  services: Service[];
  testimonials: Testimonial[];
  projects: Project[];
};

/* ── Contenido por defecto (fallback si la BD está vacía) ── */

export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    eyebrow: "Consultoría & Tecnología",
    title: "Ingeniería que sostiene",
    titleAccent: "tu negocio",
    subtitle:
      "Diseñamos, construimos y operamos la infraestructura digital de empresas que no pueden permitirse fallar. Software a medida, soporte continuo y dominio técnico real.",
    ctaPrimary: "Conversemos tu proyecto",
    ctaSecondary: "Ver servicios",
    stats: [
      { value: "+10", label: "años de experiencia" },
      { value: "99.9%", label: "uptime garantizado" },
      { value: "24/7", label: "soporte dedicado" },
    ],
  },
  marquee: {
    items: [
      "Desarrollo a medida",
      "Infraestructura TI",
      "Soporte continuo",
      "Dominios & Hosting",
      "Ciberseguridad",
      "Consultoría estratégica",
      "Automatización",
    ],
  },
  about: {
    eyebrow: "La consultora",
    title: "Tecnología seria, trato directo",
    paragraphs: [
      "Herrera Consulting & Technology nace de una convicción simple: las empresas merecen un socio tecnológico que hable claro, responda rápido y construya para durar.",
      "No vendemos horas: asumimos resultados. Cada proyecto se diseña con la infraestructura, la seguridad y el mantenimiento pensados desde el primer día.",
    ],
    bullets: [
      "Arquitectura y desarrollo de software a medida",
      "Operación y monitoreo de infraestructura crítica",
      "Acompañamiento estratégico de largo plazo",
    ],
  },
  process: {
    eyebrow: "Método",
    title: "Cómo trabajamos",
    steps: [
      {
        title: "Diagnóstico",
        description:
          "Entendemos tu operación, sus riesgos y sus oportunidades antes de proponer una sola línea de código.",
      },
      {
        title: "Propuesta clara",
        description:
          "Alcance, plazos y costos por escrito. Sin letra chica ni sorpresas a mitad de camino.",
      },
      {
        title: "Construcción",
        description:
          "Desarrollo iterativo con entregas visibles. Revisas avances reales, no promesas.",
      },
      {
        title: "Operación continua",
        description:
          "Lanzar es el comienzo: monitoreamos, mantenemos y evolucionamos contigo.",
      },
    ],
  },
  contact: {
    eyebrow: "Contacto",
    title: "Hablemos de tu próximo paso",
    subtitle:
      "Cuéntanos qué necesitas y te respondemos dentro del mismo día hábil.",
    email: "vr.herrera.c@gmail.com",
    phone: "",
    whatsapp: "",
    location: "Atención remota y presencial",
  },
  footer: {
    tagline: "Consultoría y tecnología para empresas que no se detienen.",
    copyright: "Herrera Consulting & Technology. Todos los derechos reservados.",
  },
  services: [
    {
      id: "d1",
      title: "Desarrollo de software a medida",
      description:
        "Aplicaciones web y sistemas internos construidos exactamente para tu operación: ni más, ni menos.",
      icon: "code",
      accent: "burgundy",
      sort_order: 1,
      published: true,
    },
    {
      id: "d2",
      title: "Infraestructura & Cloud",
      description:
        "Servidores, redes y nube dimensionados, seguros y monitoreados. Tu plataforma siempre disponible.",
      icon: "server",
      accent: "azul",
      sort_order: 2,
      published: true,
    },
    {
      id: "d3",
      title: "Soporte TI continuo",
      description:
        "Mesa de ayuda con tiempos de respuesta comprometidos. Un equipo técnico que conoce tu empresa.",
      icon: "support",
      accent: "esmeralda",
      sort_order: 3,
      published: true,
    },
    {
      id: "d4",
      title: "Dominios & Hosting",
      description:
        "Gestión integral de dominios, correos corporativos y alojamiento. Renovaciones sin sustos.",
      icon: "globe",
      accent: "gold",
      sort_order: 4,
      published: true,
    },
    {
      id: "d5",
      title: "Ciberseguridad",
      description:
        "Auditoría, hardening y respaldo. Protegemos los datos que sostienen tu negocio.",
      icon: "shield",
      accent: "burgundy",
      sort_order: 5,
      published: true,
    },
    {
      id: "d6",
      title: "Consultoría estratégica",
      description:
        "Decisiones tecnológicas con criterio de negocio: qué construir, qué comprar y cuándo.",
      icon: "chart",
      accent: "azul",
      sort_order: 6,
      published: true,
    },
  ],
  projects: [
    {
      id: "p1",
      title: "Plataforma de gestión corporativa",
      description:
        "Sistema integral de operaciones para empresa de servicios: tickets, facturación y reportes en tiempo real.",
      category: "Desarrollo Web",
      image_url: "",
      link: "",
      sort_order: 1,
      published: true,
    },
    {
      id: "p2",
      title: "Migración de infraestructura a la nube",
      description:
        "Rediseño completo de servidores y redes con cero tiempo de caída durante la transición.",
      category: "Infraestructura",
      image_url: "",
      link: "",
      sort_order: 2,
      published: true,
    },
    {
      id: "p3",
      title: "Automatización de procesos internos",
      description:
        "Integraciones que eliminaron 30+ horas mensuales de trabajo manual en el área administrativa.",
      category: "Automatización",
      image_url: "",
      link: "",
      sort_order: 3,
      published: true,
    },
  ],
  testimonials: [
    {
      id: "t1",
      quote:
        "Pasamos de apagar incendios cada semana a olvidarnos de que la tecnología era un problema. Eso no tiene precio.",
      author: "Cliente corporativo",
      role: "Gerencia General",
      sort_order: 1,
      published: true,
    },
    {
      id: "t2",
      quote:
        "Entendieron el negocio antes de hablar de software. La plataforma que construyeron la usamos todos los días.",
      author: "Cliente PyME",
      role: "Operaciones",
      sort_order: 2,
      published: true,
    },
  ],
};

/* ── Carga de contenido desde Supabase con fallback ──────── */

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const [settingsRes, servicesRes, testimonialsRes, projectsRes] =
      await Promise.all([
        supabase.from("site_settings").select("key, value"),
        supabase
          .from("services")
          .select("*")
          .eq("published", true)
          .order("sort_order"),
        supabase
          .from("testimonials")
          .select("*")
          .eq("published", true)
          .order("sort_order"),
        supabase
          .from("projects")
          .select("*")
          .eq("published", true)
          .order("sort_order"),
      ]);

    const settings: Record<string, unknown> = {};
    for (const row of settingsRes.data ?? []) settings[row.key] = row.value;

    return {
      hero: (settings.hero as HeroContent) ?? DEFAULT_CONTENT.hero,
      marquee: (settings.marquee as MarqueeContent) ?? DEFAULT_CONTENT.marquee,
      about: (settings.about as AboutContent) ?? DEFAULT_CONTENT.about,
      process: (settings.process as ProcessContent) ?? DEFAULT_CONTENT.process,
      contact: (settings.contact as ContactContent) ?? DEFAULT_CONTENT.contact,
      footer: (settings.footer as FooterContent) ?? DEFAULT_CONTENT.footer,
      services: servicesRes.data?.length
        ? (servicesRes.data as Service[])
        : DEFAULT_CONTENT.services,
      testimonials: testimonialsRes.data?.length
        ? (testimonialsRes.data as Testimonial[])
        : DEFAULT_CONTENT.testimonials,
      projects: projectsRes.data?.length
        ? (projectsRes.data as Project[])
        : DEFAULT_CONTENT.projects,
    };
  } catch {
    return DEFAULT_CONTENT;
  }
}
