"use client";

/* Protege rutas internas: exige sesión, contraseña ya cambiada y,
   si se indica, acceso al módulo o rol de administrador.
   (Guard de cliente; el auth definitivo se endurece en la fase final.) */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, loadSessionUser, canAccess, type ModuleKey } from "../lib/auth";

export function AuthGuard({
  module,
  adminOnly = false,
  inline = false,
  children,
}: {
  module?: ModuleKey;
  adminOnly?: boolean;
  /** true cuando el guard vive DENTRO del shell (loader sin pantalla completa) */
  inline?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      // getSession() ya trae el perfil si login() lo cacheó en esta misma
      // navegación; si no (recarga de página), se reconstruye desde la
      // sesión de Supabase Auth persistida.
      const user = getSession() ?? (await loadSessionUser());
      if (cancelled) return;
      if (!user || user.must_change_password) {
        router.replace("/login");
        return;
      }
      if ((adminOnly && !user.is_admin) || (module && !canAccess(user, module))) {
        router.replace("/inicio");
        return;
      }
      setOk(true);
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [router, module, adminOnly]);

  if (!ok) {
    return (
      <div
        className={
          inline
            ? "flex min-h-[40vh] items-center justify-center"
            : "flex min-h-screen items-center justify-center bg-void"
        }
      >
        <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-crimson" />
      </div>
    );
  }
  return <>{children}</>;
}
