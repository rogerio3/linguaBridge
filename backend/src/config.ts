import * as fs from "fs";
import * as path from "path";

function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

export const config = {
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  databaseUrl:      process.env.DATABASE_URL ?? "",
  port:             Number(process.env.PORT ?? 3001),
  host:             process.env.HOST ?? "0.0.0.0",
  openrouterBase:   "https://openrouter.ai/api/v1",
};
