"use client";

/* Componentes de UI compartidos del panel de administración */

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
        {label}
      </span>
      <input className="field" {...props} />
    </label>
  );
}

export function TextArea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
        {label}
      </span>
      <textarea className="field resize-y" {...props} />
    </label>
  );
}

export type SaveState = "idle" | "saving" | "saved" | "error";

export function SaveButton({
  state,
  children = "Guardar cambios",
}: {
  state: SaveState;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        disabled={state === "saving"}
        className="rounded-lg bg-burgundy px-5 py-2.5 text-sm font-semibold text-ivory transition-all hover:-translate-y-0.5 hover:bg-burgundy-bright disabled:opacity-60"
      >
        {state === "saving" ? "Guardando…" : children}
      </button>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-ink/8 bg-white p-6 shadow-[0_2px_12px_rgba(30,33,37,0.04)] lg:p-8">
      <h2 className="font-display text-xl font-medium text-ink">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-ink-faint">{description}</p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}
