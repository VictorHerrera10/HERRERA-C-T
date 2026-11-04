import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || "";
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function check() {
  console.log("Probando conexión a Supabase en:", env.NEXT_PUBLIC_SUPABASE_URL ? "URL Configurada" : "NO CONFIGURADA");

  try {
    // 1. Probar lectura tabla pública existente
    const { data: settings, error: errSettings } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1);

    console.log(
      "Conexión de lectura site_settings:",
      errSettings ? `Error: ${errSettings.message}` : `OK, registros: ${settings?.length ?? 0}`
    );

    // 2. Verificar tablas tentativas de certificados
    const certTables = [
      "certificates",
      "certificados",
      "issued_certificates",
      "certificate_templates",
      "cert_templates",
    ];

    for (const table of certTables) {
      const { data, error } = await supabase.from(table).select("*").limit(1);
      if (!error) {
        console.log(`Tabla [${table}]: EXISTE (registros: ${data?.length ?? 0})`);
      } else {
        console.log(`Tabla [${table}]: NO EXISTE o sin acceso (${error.code}: ${error.message})`);
      }
    }

    // 3. Probar RPC pública hct_verify_certificate
    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "hct_verify_certificate",
      { p_code: "HZ-DEMO-VALIDO" }
    );
    if (!rpcErr) {
      console.log("RPC hct_verify_certificate: EXISTE");
    } else {
      console.log(`RPC hct_verify_certificate: NO EXISTE (${rpcErr.message})`);
    }
  } catch (e) {
    console.error("Fallo general:", e.message);
  }
}

check();

