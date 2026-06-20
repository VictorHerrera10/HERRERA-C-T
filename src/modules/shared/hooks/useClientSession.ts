"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/modules/shared/lib/supabase";

export type ClientSession = {
  token: string;
  user_name: string;
  user_dni: string;
  user_email: string;
  user_phone: string;
  user_role: string;
  client_name: string;
  client_ruc: string;
  client_address: string;
  client_phone: string;
  client_sector: string;
  modules: string[];
  source: string;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; session: ClientSession }
  | { status: "none" }   // sin token en URL
  | { status: "error" }; // token inválido o vencido

export function useClientSession(): State {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    if (!token) { setState({ status: "none" }); return; }

    setState({ status: "loading" });

    supabase
      .rpc("resolve_client_token", { p_token: token })
      .then(({ data, error }) => {
        if (error || !data) { setState({ status: "error" }); return; }
        setState({ status: "ready", session: data as ClientSession });
      });
  }, [token]);

  return state;
}
