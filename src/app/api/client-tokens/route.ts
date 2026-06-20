import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/modules/shared/lib/supabase";

const API_KEY = process.env.HCT_API_KEY ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

// Preflight CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  // Verificar API key
  const key = req.headers.get("x-api-key");
  if (!API_KEY || key !== API_KEY) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const {
    user_name, user_dni, user_email, user_phone, user_role,
    client_name, client_ruc, client_address, client_phone, client_sector,
    modules, source, expires_at,
  } = body as Record<string, unknown>;

  if (!user_name || !client_name) {
    return NextResponse.json(
      { error: "user_name y client_name son obligatorios" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { data, error } = await supabase.rpc("create_client_token", {
    p_user_name:      user_name,
    p_user_dni:       user_dni       ?? "",
    p_user_email:     user_email     ?? "",
    p_user_phone:     user_phone     ?? "",
    p_user_role:      user_role      ?? "",
    p_client_name:    client_name,
    p_client_ruc:     client_ruc     ?? "",
    p_client_address: client_address ?? "",
    p_client_phone:   client_phone   ?? "",
    p_client_sector:  client_sector  ?? "",
    p_modules:        modules        ?? [],
    p_source:         source         ?? "",
    p_expires_at:     expires_at     ?? null,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  const { token } = data as { id: string; token: string };
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://herrera-ct.vercel.app";

  return NextResponse.json(
    {
      token,
      urls: {
        ventas:  `${base}/ventas?token=${token}`,
        soporte: `${base}/soporte?token=${token}`,
      },
    },
    { headers: CORS_HEADERS }
  );
}
