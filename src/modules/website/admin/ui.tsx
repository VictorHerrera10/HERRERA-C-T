"use client";

/* Componentes de UI compartidos del panel de administración */

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-fog">
        {label}
      </span>
      <input className="field-dark" {...props} />
    </label>
  );
}

export function TextArea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-fog">
        {label}
      </span>
      <textarea className="field-dark resize-y" {...props} />
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
        className="rounded-lg bg-crimson px-5 py-2.5 text-sm font-semibold text-snow transition-all hover:-translate-y-0.5 hover:bg-crimson-bright disabled:opacity-60"
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
    <section className="rounded-lg border border-edge bg-carbon/70 p-6 lg:p-8">
      <h2 className="font-display text-xl font-medium text-snow">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-fog">{description}</p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}
