import * as https from "https";
import { config } from "./config.js";
import type { OpenRouterRequest, OpenRouterResponse } from "./types.js";

function httpsPost(url: string, body: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), ...headers } },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf-8");
          if (res.statusCode && res.statusCode >= 400) reject(new Error(`OpenRouter ${res.statusCode}: ${raw}`));
          else resolve(raw);
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function httpsGet(url: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname, method: "GET", headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

const AUTH_HEADERS = () => ({
  Authorization: `Bearer ${config.openrouterApiKey}`,
  "HTTP-Referer": "http://localhost:3001",
  "X-Title": "LinguaBridge",
});

export async function callOpenRouter(payload: OpenRouterRequest): Promise<OpenRouterResponse> {
  const raw = await httpsPost(
    `${config.openrouterBase}/chat/completions`,
    JSON.stringify(payload),
    AUTH_HEADERS()
  );
  return JSON.parse(raw) as OpenRouterResponse;
}

export async function fetchAvailableModels(): Promise<Array<{ id: string; name: string }>> {
  const raw = await httpsGet(`${config.openrouterBase}/models`, AUTH_HEADERS());
  const parsed = JSON.parse(raw) as { data: Array<{ id: string; name: string }> };
  return parsed.data ?? [];
}
