import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ── getLanguageName ──────────────────────────────────────────

describe("getLanguageName", () => {
  it("deve retornar nome de idioma conhecido", async () => {
    const { getLanguageName } = await import("../translate.js");
    assert.equal(getLanguageName("en"), "English");
    assert.equal(getLanguageName("pt"), "Portuguese");
    assert.equal(getLanguageName("fr"), "French");
    assert.equal(getLanguageName("ja"), "Japanese");
    assert.equal(getLanguageName("zh"), "Chinese");
  });

  it("deve ignorar caixa alta/baixa no código", async () => {
    const { getLanguageName } = await import("../translate.js");
    assert.equal(getLanguageName("EN"), "English");
    assert.equal(getLanguageName("Pt"), "Portuguese");
    assert.equal(getLanguageName("FR"), "French");
  });

  it("deve retornar o código em maiúsculas para idioma desconhecido", async () => {
    const { getLanguageName } = await import("../translate.js");
    assert.equal(getLanguageName("xx"), "XX");
    assert.equal(getLanguageName("xyz"), "XYZ");
  });

  it("deve retornar string vazia para código vazio", async () => {
    const { getLanguageName } = await import("../translate.js");
    assert.equal(getLanguageName(""), "");
  });
});

// ── config ───────────────────────────────────────────────────

describe("config", () => {
  it("deve carregar variáveis do .env", () => {
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    assert.ok(openrouterKey, "OPENROUTER_API_KEY deve estar definida no .env");
    assert.match(openrouterKey, /^sk-or-v1-/, "deve começar com sk-or-v1-");
  });

  it("deve expor openrouterBase fixo", async () => {
    const { config } = await import("../config.js");
    assert.equal(config.openrouterBase, "https://openrouter.ai/api/v1");
  });

  it("deve ter valores default para PORT e HOST", () => {
    const port = process.env.PORT ?? "3001";
    const host = process.env.HOST ?? "0.0.0.0";
    assert.equal(port, "3001");
    assert.equal(host, "0.0.0.0");
  });
});

// ── parse do JSON do LLM (lógica interna do translateText) ───

describe("translateText — parse do LLM", () => {
  it("deve limpar markdown code block da resposta", async () => {
    const raw = "```json\n{\"detectedLanguage\":\"en\",\"detectedLanguageName\":\"English\",\"translations\":[]}\n```";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(clean);
    assert.equal(parsed.detectedLanguage, "en");
    assert.equal(parsed.detectedLanguageName, "English");
  });

  it("deve funcionar sem code block", async () => {
    const raw = '{"detectedLanguage":"pt","detectedLanguageName":"Portuguese","translations":[]}';
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(clean);
    assert.equal(parsed.detectedLanguage, "pt");
  });
});
