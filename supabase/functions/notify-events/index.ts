// Edge Function invocada por Supabase Database Webhooks en:
//   INSERT en tickets, UPDATE en tickets (cambio de status),
//   INSERT en ticket_comments, INSERT en leads.
// Resuelve destinatarios (app_users con el módulo correspondiente +
// device_push_tokens) y envía la notificación vía Expo Push API.
// No requiere cuenta Firebase propia: Expo gestiona FCM internamente.
//
// Deploy manual: `supabase functions deploy notify-events`
// Configurar 4 Database Webhooks en el Dashboard → Database → Webhooks
// apuntando cada uno a esta función (ver AGENTS.md / plan de la app móvil).

import { createClient } from "jsr:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: "tickets" | "ticket_comments" | "leads";
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
};

type Notification = { title: string; body: string; data: Record<string, string> };

function buildNotification(payload: WebhookPayload): { module: "helpdesk" | "website"; notification: Notification } | null {
  const { type, table, record, old_record } = payload;

  if (table === "tickets" && type === "INSERT") {
    return {
      module: "helpdesk",
      notification: {
        title: "Nuevo ticket",
        body: String(record.title ?? "Se creó un ticket nuevo"),
        data: { type: "ticket", id: String(record.id) },
      },
    };
  }

  if (table === "tickets" && type === "UPDATE" && old_record && record.status !== old_record.status) {
    return {
      module: "helpdesk",
      notification: {
        title: "Ticket actualizado",
        body: `${String(record.title ?? "Un ticket")} cambió a "${String(record.status)}"`,
        data: { type: "ticket", id: String(record.id) },
      },
    };
  }

  if (table === "ticket_comments" && type === "INSERT") {
    return {
      module: "helpdesk",
      notification: {
        title: "Nueva respuesta en un ticket",
        body: String(record.body ?? "").slice(0, 120),
        data: { type: "ticket", id: String(record.ticket_id) },
      },
    };
  }

  if (table === "leads" && type === "INSERT") {
    return {
      module: "website",
      notification: {
        title: "Nuevo mensaje de contacto",
        body: `${String(record.name ?? "Alguien")} escribió desde el sitio`,
        data: { type: "lead", id: String(record.id) },
      },
    };
  }

  return null;
}

async function recipientsForModule(module: "helpdesk" | "website"): Promise<string[]> {
  const { data: users } = await supabaseAdmin
    .from("app_users")
    .select("id, is_admin, modules")
    .eq("active", true);

  const userIds = (users ?? [])
    .filter((u) => u.is_admin || (u.modules as string[])?.includes(module))
    .map((u) => u.id);

  if (!userIds.length) return [];

  const { data: tokens } = await supabaseAdmin
    .from("device_push_tokens")
    .select("expo_push_token")
    .in("user_id", userIds);

  return (tokens ?? []).map((t) => t.expo_push_token as string);
}

async function sendExpoPush(tokens: string[], notification: Notification) {
  const messages = tokens.map((to) => ({ to, ...notification }));
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(batch),
    });
  }
}

Deno.serve(async (req) => {
  const payload = (await req.json()) as WebhookPayload;
  const built = buildNotification(payload);
  if (!built) return new Response("ignored", { status: 200 });

  const tokens = await recipientsForModule(built.module);
  if (tokens.length) await sendExpoPush(tokens, built.notification);

  return new Response("ok", { status: 200 });
});
