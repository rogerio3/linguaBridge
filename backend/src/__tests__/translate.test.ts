import { describe, it, before, mock } from "node:test";
import assert from "node:assert/strict";

// ── Helpers ──────────────────────────────────────────────────

function buildMockLLMResponse(content: string) {
  return {
    id: "mock-id",
    model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    choices: [{ message: { role: "assistant" as const, content }, finish_reason: "stop" as const }],
  };
}

// ── Mock modules ─────────────────────────────────────────────

type MockOpenRouter = {
  callOpenRouter: (...args: any[]) => any;
};

type MockPrisma = {
  $transaction: (...args: any[]) => any;
  translationSession: {
    findUnique: (...args: any[]) => any;
    create: (...args: any[]) => any;
  };
  translation: {
    create: (...args: any[]) => any;
  };
  translationResult: {
    create: (...args: any[]) => any;
  };
};

const mockOpenRouter: MockOpenRouter = {
  callOpenRouter: mock.fn<(...args: any[]) => any>(),
};

const mockPrisma: MockPrisma = {
  $transaction: mock.fn<(...args: any[]) => any>(),
  translationSession: {
    findUnique: mock.fn<(...args: any[]) => any>(),
    create: mock.fn<(...args: any[]) => any>(),
  },
  translation: {
    create: mock.fn<(...args: any[]) => any>(),
  },
  translationResult: {
    create: mock.fn<(...args: any[]) => any>(),
  },
};

before(() => {
  mock.module("../openrouter.js", {
    exports: { callOpenRouter: mockOpenRouter.callOpenRouter },
  });
  mock.module("../db.js", {
    exports: { prisma: mockPrisma },
  });
});

function resetMocks(): void {
  mockOpenRouter.callOpenRouter.mock.resetCalls();
  mockPrisma.$transaction.mock.resetCalls();
  mockPrisma.translationSession.findUnique.mock.resetCalls();
  mockPrisma.translationSession.create.mock.resetCalls();
  mockPrisma.translation.create.mock.resetCalls();
  mockPrisma.translationResult.create.mock.resetCalls();
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
    resetMocks();
    const { translateText } = await import("../translate.js");

    mockOpenRouter.callOpenRouter.mock.mockImplementation(
      async () => buildMockLLMResponse(JSON.stringify({
        detectedLanguage: "pt",
        detectedLanguageName: "Portuguese",
        translations: [
          { language: "en", languageName: "English", translatedText: "Hello" },
        ],
      })),
    );

    mockPrisma.$transaction.mock.mockImplementation(
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
    assert.equal(mockOpenRouter.callOpenRouter.mock.calls.length, 1);
    assert.equal(mockPrisma.$transaction.mock.calls.length, 1);
  });

  it("deve rejeitar JSON inválido vindo do LLM", async () => {
    resetMocks();
    const { translateText } = await import("../translate.js");

    mockOpenRouter.callOpenRouter.mock.mockImplementation(
      async () => buildMockLLMResponse("I'm sorry, I cannot process this."),
    );

    mockPrisma.$transaction.mock.mockImplementation(
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

    await assert.rejects(
      () => translateText({ text: "Olá", targetLanguages: ["en"] }),
      (err: Error) => err.message.startsWith("LLM returned non-JSON"),
    );
  });
});