"use client";

/* Perfil del trabajador: foto (bucket "users"), datos básicos y
   cambio de contraseña. El DNI, área, rol y módulos los gestiona el admin. */

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { Icon } from "@/modules/shared/components/Icon";
import { useToast } from "@/modules/shared/components/Toast";
import {
  getSession,
  saveSession,
  changePassword,
  roleLabel,
  MODULES,
  canAccess,
  type SessionUser,
} from "../lib/auth";

export function ProfileView() {
  const toast = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passBusy, setPassBusy] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = getSession();
    if (s) {
      setUser(s);
      setFirstName(s.first_name);
      setLastName(s.last_name);
      setEmail(s.email);
      setPhone(s.phone);
    }
  }, []);

  if (!user) return null;

  function applySession(patch: Partial<SessionUser>) {
    const updated = { ...user!, ...patch };
    setUser(updated);
    saveSession(updated);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const patch = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };
    const { error } = await supabase
      .from("app_users")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", user!.id);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar el perfil", error.message);
    applySession(patch);
    toast.success("Perfil actualizado");
  }

  /* Sube la foto al bucket "users" y guarda la URL pública */
  async function uploadAvatar(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("users").upload(path, file);
    if (error) {
      setUploading(false);
      return toast.error(
        "No se pudo subir la foto",
        `${error.message} — ¿Ejecutaste migration-usuarios.sql?`
      );
    }
    const url = supabase.storage.from("users").getPublicUrl(path).data.publicUrl;
    const { error: e2 } = await supabase
      .from("app_users")
      .update({ avatar_url: url, updated_at: new Date().toISOString() })
      .eq("id", user!.id);
    setUploading(false);
    if (e2) return toast.error("No se pudo guardar la foto", e2.message);
    applySession({ avatar_url: url });
    toast.success("Foto de perfil actualizada");
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPass.length < 8)
      return toast.warning("Contraseña muy corta", "Mínimo 8 caracteres.");
    if (newPass !== confirm)
      return toast.warning("Las contraseñas no coinciden");
    setPassBusy(true);
    try {
      const ok = await changePassword(user!.id, current, newPass);
      if (!ok) {
        toast.error("La contraseña actual no es correcta");
        return;
      }
      setCurrent("");
      setNewPass("");
      setConfirm("");
      toast.success("Contraseña actualizada");
    } catch (err) {
      toast.error(
        "Error de conexión",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setPassBusy(false);
    }
  }

  const myModules = MODULES.filter((m) => canAccess(user, m.key));

  return (
    <div className="max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="section-number">/ mi perfil</p>
        <h1 className="mt-2 font-display text-3xl font-bold">
          Tu identidad en la plataforma
        </h1>
      </motion.div>

      {/* Identidad */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 rounded-2xl border border-edge bg-carbon/70 p-7"
      >
        <div className="flex flex-wrap items-center gap-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-edge bg-steel"
            title="Cambiar foto"
          >
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-crimson-bright">
                {(user.first_name[0] ?? "") + (user.last_name[0] ?? "")}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-void/70 text-[10px] font-semibold uppercase tracking-wider text-snow opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? "Subiendo…" : "Cambiar"}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
              e.target.value = "";
            }}
          />
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold">
              {firstName || user.dni} {lastName}
            </p>
            <p className="mt-1 text-sm text-fog">{roleLabel(user)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-full border border-edge bg-steel px-2.5 py-1 font-mono tracking-wider text-fog">
                DNI {user.dni}
              </span>
              {user.area_name && (
                <span className="rounded-full border border-edge bg-steel px-2.5 py-1 text-fog">
                  {user.area_name}
                </span>
              )}
              {user.is_admin && (
                <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 font-semibold text-gold-soft">
                  Administrador
                </span>
              )}
              {myModules.map((m) => (
                <span
                  key={m.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-steel px-2.5 py-1 text-fog"
                >
                  <Icon name={m.icon} className={`h-3 w-3 ${m.accent}`} />
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={saveProfile} className="mt-7 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-fog">
              Nombres
            </label>
            <input
              className="field-dark mt-2"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Víctor"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-fog">
              Apellidos
            </label>
            <input
              className="field-dark mt-2"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Herrera"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-fog">
              Correo
            </label>
            <input
              className="field-dark mt-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@herrera-ct.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-fog">
              Teléfono
            </label>
            <input
              className="field-dark mt-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+51 999 999 999"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              disabled={saving}
              className="rounded-xl bg-crimson px-6 py-3 font-display text-xs font-semibold uppercase tracking-wider transition-all hover:bg-crimson-bright disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </motion.section>

      {/* Contraseña */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-6 rounded-2xl border border-edge bg-carbon/70 p-7"
      >
        <h2 className="font-display text-lg font-semibold">Contraseña</h2>
        <p className="mt-1 text-sm text-fog">
          Cámbiala cuando quieras. Nunca vuelvas a usar tu DNI como clave.
        </p>
        <form onSubmit={handlePassword} className="mt-5 grid gap-4 sm:grid-cols-3">
          <input
            className="field-dark"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Contraseña actual"
          />
          <input
            className="field-dark"
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="Nueva (mín. 8)"
          />
          <input
            className="field-dark"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repite la nueva"
          />
          <div className="sm:col-span-3">
            <button
              disabled={passBusy}
              className="rounded-xl border border-edge px-6 py-3 font-display text-xs font-semibold uppercase tracking-wider text-snow transition-colors hover:border-crimson/60 disabled:opacity-50"
            >
              {passBusy ? "Actualizando…" : "Actualizar contraseña"}
            </button>
          </div>
        </form>
      </motion.section>
    </div>
  );
}
