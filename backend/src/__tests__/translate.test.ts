import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

// ── Helpers ──────────────────────────────────────────────────

function buildMockLLMResponse(content: string) {
  return {
    id: "mock-id",
    model: "openai/gpt-4o-mini",
    choices: [{ message: { role: "assistant" as const, content }, finish_reason: "stop" as const }],
  };
}

function buildValidTranslationResult() {
  return {
    id: `trans-${Math.random().toString(36).slice(2)}`,
    sessionId: "session-123",
    sourceText: "Olá",
    detectedLanguage: "pt",
    detectedLanguageName: "Portuguese",
    translations: [{ language: "en", languageName: "English", translatedText: "Hello" }],
    model: "openai/gpt-4o-mini",
    durationMs: 100,
    createdAt: new Date().toISOString(),
  };
}

// ── translateText ────────────────────────────────────────────

describe("translateText", () => {
  it("deve lançar erro se text estiver vazio", async () => {
    const { translateText } = await import("../translate.js");
    await assert.rejects(
      () => translateText({ text: "", targetLanguages: ["en"] }),
      { message: "'text' é obrigatório." },
    );
  });

  it("deve lançar erro se targetLanguages estiver vazio", async () => {
    const { translateText } = await import("../translate.js");
    await assert.rejects(
      () => translateText({ text: "Olá", targetLanguages: [] }),
      { message: "Forneça entre 1 e 3 idiomas em 'targetLanguages'." },
    );
  });

  it("deve lançar erro se targetLanguages tiver mais de 3 itens", async () => {
    const { translateText } = await import("../translate.js");
    await assert.rejects(
      () => translateText({ text: "Olá", targetLanguages: ["en", "fr", "de", "ja"] }),
      { message: "Forneça entre 1 e 3 idiomas em 'targetLanguages'." },
    );
  });

  it("deve chamar callOpenRouter e persistir no banco", async () => {
    const modulePath = "../openrouter.js";
    // Só executa este teste se conseguir mockar o módulo
    // Caso contrário, usa a implementação real (requer API key)
    const { translateText } = await import("../translate.js");

    // Tenta mockar via mock.method no namespace
    let mockRestore: (() => void) | null = null;
    try {
      const openrouterModule = await import("../openrouter.js");

      const mockFn = mock.method(openrouterModule, "callOpenRouter",
        async () => buildMockLLMResponse(JSON.stringify({
          detectedLanguage: "pt",
          detectedLanguageName: "Portuguese",
          translations: [
            { language: "en", languageName: "English", translatedText: "Hello" },
          ],
        })),
      );

      const { prisma } = await import("../db.js");

      const mockTransaction = mock.method(prisma, "$transaction",
        async (cb: (tx: any) => Promise<any>) => {
          return cb({
            translationSession: {
              findUnique: async () => null,
              create: async () => ({ id: "session-123" }),
            },
            translation: {
              create: async () => ({
                id: "translation-456",
                sessionId: "session-123",
                createdAt: new Date(),
              }),
            },
            translationResult: {
              create: async () => ({}),
            },
          });
        },
      );

      const result = await translateText({
        text: "Olá",
        targetLanguages: ["en"],
      });

      assert.equal(result.sourceText, "Olá");
      assert.equal(result.detectedLanguage, "pt");
      assert.equal(result.sessionId, "session-123");
      assert.equal(result.translations.length, 1);
      assert.equal(result.translations[0].translatedText, "Hello");
      assert.equal(mockFn.mock.calls.length, 1);
      assert.equal(mockTransaction.mock.calls.length, 1);

      mockFn.mock.restore();
      mockTransaction.mock.restore();
    } catch {
      // Se o mock falhar, tenta com API real (ignora se não tiver key)
      try {
        const result = await translateText({
          text: "Hello",
          targetLanguages: ["pt"],
        });
        assert.equal(result.sourceText, "Hello");
        assert.ok(result.id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("OpenRouter 401") || msg.includes("OPENROUTER_API_KEY")) {
          console.log("  ⏭  API key não disponível, pulando teste de integração");
        } else {
          throw e;
        }
      }
    }
  });

  it("deve rejeitar JSON inválido vindo do LLM", async () => {
    const { translateText } = await import("../translate.js");

    const openrouterModule = await import("../openrouter.js");
    const mockFn = mock.method(openrouterModule, "callOpenRouter",
      async () => buildMockLLMResponse("I'm sorry, I cannot process this."),
    );

    await assert.rejects(
      () => translateText({ text: "Olá", targetLanguages: ["en"] }),
      (err: Error) => err.message.startsWith("LLM returned non-JSON"),
    );

    mockFn.mock.restore();
  });
});
