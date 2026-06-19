"use client";

import {
  DEFAULT_CONTENT,
  type HeroContent,
  type MarqueeContent,
  type AboutContent,
  type ProcessContent,
  type ContactContent,
  type FooterContent,
} from "@/modules/website/lib/content";
import { Field, TextArea, SaveButton, SectionCard } from "./ui";
import { useSetting } from "./useSetting";

function Loading() {
  return <p className="text-sm text-ink-faint">Cargando…</p>;
}

/* ── Hero ────────────────────────────────────────────────── */

export function HeroForm() {
  const { value, setValue, loading, state, save } = useSetting<HeroContent>(
    "hero",
    DEFAULT_CONTENT.hero
  );
  if (loading) return <Loading />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-5"
    >
      <Field
        label="Etiqueta superior (eyebrow)"
        value={value.eyebrow}
        onChange={(e) => setValue({ ...value, eyebrow: e.target.value })}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Título principal"
          value={value.title}
          onChange={(e) => setValue({ ...value, title: e.target.value })}
        />
        <Field
          label="Palabras destacadas (en dorado cursiva)"
          value={value.titleAccent}
          onChange={(e) => setValue({ ...value, titleAccent: e.target.value })}
        />
      </div>
      <TextArea
        label="Subtítulo"
        rows={3}
        value={value.subtitle}
        onChange={(e) => setValue({ ...value, subtitle: e.target.value })}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Texto botón principal"
          value={value.ctaPrimary}
          onChange={(e) => setValue({ ...value, ctaPrimary: e.target.value })}
        />
        <Field
          label="Texto botón secundario"
          value={value.ctaSecondary}
          onChange={(e) => setValue({ ...value, ctaSecondary: e.target.value })}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
          Estadísticas (3)
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {value.stats.map((s, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-ink/8 p-3">
              <input
                className="field"
                placeholder="Valor (ej. 99.9%)"
                value={s.value}
                onChange={(e) => {
                  const stats = [...value.stats];
                  stats[i] = { ...stats[i], value: e.target.value };
                  setValue({ ...value, stats });
                }}
              />
              <input
                className="field"
                placeholder="Etiqueta"
                value={s.label}
                onChange={(e) => {
                  const stats = [...value.stats];
                  stats[i] = { ...stats[i], label: e.target.value };
                  setValue({ ...value, stats });
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <SaveButton state={state} />
    </form>
  );
}

/* ── Marquee (cinta de especialidades) ───────────────────── */

export function MarqueeForm() {
  const { value, setValue, loading, state, save } = useSetting<MarqueeContent>(
    "marquee",
    DEFAULT_CONTENT.marquee
  );
  if (loading) return <Loading />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-5"
    >
      <TextArea
        label="Especialidades (una por línea)"
        rows={6}
        value={value.items.join("\n")}
        onChange={(e) =>
          setValue({ items: e.target.value.split("\n").filter((l) => l.trim()) })
        }
      />
      <SaveButton state={state} />
    </form>
  );
}

/* ── Nosotros ────────────────────────────────────────────── */

export function AboutForm() {
  const { value, setValue, loading, state, save } = useSetting<AboutContent>(
    "about",
    DEFAULT_CONTENT.about
  );
  if (loading) return <Loading />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Etiqueta"
          value={value.eyebrow}
          onChange={(e) => setValue({ ...value, eyebrow: e.target.value })}
        />
        <Field
          label="Título"
          value={value.title}
          onChange={(e) => setValue({ ...value, title: e.target.value })}
        />
      </div>
      <TextArea
        label="Párrafos (uno por línea)"
        rows={6}
        value={value.paragraphs.join("\n")}
        onChange={(e) =>
          setValue({
            ...value,
            paragraphs: e.target.value.split("\n").filter((l) => l.trim()),
          })
        }
      />
      <TextArea
        label="Puntos destacados (uno por línea)"
        rows={4}
        value={value.bullets.join("\n")}
        onChange={(e) =>
          setValue({
            ...value,
            bullets: e.target.value.split("\n").filter((l) => l.trim()),
          })
        }
      />
      <SaveButton state={state} />
    </form>
  );
}

/* ── Método (pasos) ──────────────────────────────────────── */

export function ProcessForm() {
  const { value, setValue, loading, state, save } = useSetting<ProcessContent>(
    "process",
    DEFAULT_CONTENT.process
  );
  if (loading) return <Loading />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Etiqueta"
          value={value.eyebrow}
          onChange={(e) => setValue({ ...value, eyebrow: e.target.value })}
        />
        <Field
          label="Título"
          value={value.title}
          onChange={(e) => setValue({ ...value, title: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        {value.steps.map((step, i) => (
          <div key={i} className="rounded-lg border border-ink/8 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-sm italic text-gold">
                Paso {i + 1}
              </span>
              <button
                type="button"
                onClick={() =>
                  setValue({
                    ...value,
                    steps: value.steps.filter((_, j) => j !== i),
                  })
                }
                className="text-xs font-medium text-burgundy hover:underline"
              >
                Eliminar
              </button>
            </div>
            <div className="space-y-2">
              <input
                className="field"
                placeholder="Título del paso"
                value={step.title}
                onChange={(e) => {
                  const steps = [...value.steps];
                  steps[i] = { ...steps[i], title: e.target.value };
                  setValue({ ...value, steps });
                }}
              />
              <textarea
                className="field resize-y"
                rows={2}
                placeholder="Descripción"
                value={step.description}
                onChange={(e) => {
                  const steps = [...value.steps];
                  steps[i] = { ...steps[i], description: e.target.value };
                  setValue({ ...value, steps });
                }}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setValue({
              ...value,
              steps: [...value.steps, { title: "", description: "" }],
            })
          }
          className="rounded-lg border border-dashed border-ink/20 px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-burgundy/50 hover:text-burgundy"
        >
          + Agregar paso
        </button>
      </div>

      <SaveButton state={state} />
    </form>
  );
}

/* ── Contacto ────────────────────────────────────────────── */

export function ContactForm() {
  const { value, setValue, loading, state, save } = useSetting<ContactContent>(
    "contact",
    DEFAULT_CONTENT.contact
  );
  if (loading) return <Loading />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Etiqueta"
          value={value.eyebrow}
          onChange={(e) => setValue({ ...value, eyebrow: e.target.value })}
        />
        <Field
          label="Título"
          value={value.title}
          onChange={(e) => setValue({ ...value, title: e.target.value })}
        />
      </div>
      <TextArea
        label="Subtítulo"
        rows={2}
        value={value.subtitle}
        onChange={(e) => setValue({ ...value, subtitle: e.target.value })}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Correo"
          type="email"
          value={value.email}
          onChange={(e) => setValue({ ...value, email: e.target.value })}
        />
        <Field
          label="Teléfono"
          value={value.phone}
          onChange={(e) => setValue({ ...value, phone: e.target.value })}
        />
        <Field
          label="WhatsApp (con código de país)"
          placeholder="+56 9 1234 5678"
          value={value.whatsapp}
          onChange={(e) => setValue({ ...value, whatsapp: e.target.value })}
        />
        <Field
          label="Ubicación"
          value={value.location}
          onChange={(e) => setValue({ ...value, location: e.target.value })}
        />
      </div>
      <SaveButton state={state} />
    </form>
  );
}

/* ── Pie de página ───────────────────────────────────────── */

export function FooterForm() {
  const { value, setValue, loading, state, save } = useSetting<FooterContent>(
    "footer",
    DEFAULT_CONTENT.footer
  );
  if (loading) return <Loading />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-5"
    >
      <Field
        label="Frase del pie de página"
        value={value.tagline}
        onChange={(e) => setValue({ ...value, tagline: e.target.value })}
      />
      <Field
        label="Texto de copyright"
        value={value.copyright}
        onChange={(e) => setValue({ ...value, copyright: e.target.value })}
      />
      <SaveButton state={state} />
    </form>
  );
}
