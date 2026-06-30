import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as https from "node:https";
import { config } from "../config.js";

// ── Helpers ──────────────────────────────────────────────────

function httpsGet(url: string, headers: Record<string, string>): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname, method: "GET", headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () =>
          resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf-8") }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}

// ── Tests ────────────────────────────────────────────────────

describe("OpenRouter API Key", () => {
  const key = config.openrouterApiKey;
  const baseUrl = config.openrouterBase;
  const placeholderPattern = /COLOQUE_SUA_CHAVE|PLACE.YOUR.KEY|your.api.key/i;
  const apiKeyPattern = /^sk-or-v1-[a-f0-9]{64}$/;

  describe("configuração local", () => {
    it("deve estar presente (não vazia)", () => {
      assert.ok(key, "OPENROUTER_API_KEY não está definida no .env");
    });

    it("deve ter o formato sk-or-v1-<64 hex chars>", () => {
      assert.match(key, apiKeyPattern,
        `Formato inválido. Esperado: sk-or-v1-<64 hex chars>. Obtido: "${key.slice(0, 20)}…"`,
      );
    });

    it("não deve conter valor placeholder do template", () => {
      assert.doesNotMatch(key, placeholderPattern,
        "A chave ainda contém o valor placeholder. Gere uma chave real em https://openrouter.ai/keys",
      );
    });
  });

  describe("validação contra a API OpenRouter", () => {
    it("deve autenticar com sucesso (GET /models retorna 200)", async () => {
      const { status, body } = await httpsGet(`${baseUrl}/models`, {
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "http://localhost:3001",
        "X-Title": "LinguaBridge",
      });

      if (status === 200) {
        const parsed = JSON.parse(body);
        assert.ok(parsed.data, "Resposta 200 sem campo 'data'");
        assert.ok(Array.isArray(parsed.data), "Campo 'data' não é um array");
        console.log(`  ✓ Chave válida — ${parsed.data.length} modelos disponíveis`);
        return;
      }

      // Qualquer status diferente de 200 é falha
      let message = `HTTP ${status}`;
      try {
        const err = JSON.parse(body);
        message += ` — ${err.error?.message ?? err.message ?? body}`;
      } catch {
        message += ` — ${body}`;
      }
      assert.fail(message);
    });
  });
});
