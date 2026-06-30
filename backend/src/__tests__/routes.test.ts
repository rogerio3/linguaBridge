import { describe, it, before, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

// ── Mocks ────────────────────────────────────────────────────

const mockTranslateText = mock.fn<(...args: any[]) => any>();
const mockGetHistory = mock.fn<(...args: any[]) => any>();
const mockDeleteTranslation = mock.fn<(...args: any[]) => any>();
const mockFetchAvailableModels = mock.fn<(...args: any[]) => any>();

function resetMocks(): void {
  mockTranslateText.mock.resetCalls();
  mockGetHistory.mock.resetCalls();
  mockDeleteTranslation.mock.resetCalls();
  mockFetchAvailableModels.mock.resetCalls();
}

// ── Tests ────────────────────────────────────────────────────

describe("routes", () => {
  let app: any;
  let registerRoutes: (app: any) => Promise<void>;

  before(async () => {
    mock.module("../translate.js", {
      exports: { translateText: mockTranslateText },
    });
    mock.module("../history.js", {
      exports: {
        getHistory: mockGetHistory,
        deleteTranslation: mockDeleteTranslation,
      },
    });
    mock.module("../openrouter.js", {
      exports: { fetchAvailableModels: mockFetchAvailableModels },
    });

    const mod = await import("../routes.js");
    registerRoutes = mod.registerRoutes;
  });

  beforeEach(async () => {
    resetMocks();
    const Fastify = (await import("fastify")).default;
    app = Fastify({ logger: false });
    await registerRoutes(app);
  });

  afterEach(async () => {
    await app.close();
  });

  // ── Health ─────────────────────────────────

  describe("GET /health", () => {
    it("deve retornar status ok", async () => {
      const res = await app.inject({ method: "GET", url: "/health" });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.status, "ok");
      assert.ok(body.ts);
    });
  });
  // ── Models ─────────────────────────────────

  describe("GET /models", () => {
    it("deve retornar modelos disponíveis", async () => {
      mockFetchAvailableModels.mock.mockImplementation(async () => [
        { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", name: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" },
        { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku" },
      ]);

      const res = await app.inject({ method: "GET", url: "/models" });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.ok(Array.isArray(body.models));
    });

    it("deve retornar CURATED_MODELS como fallback se API falhar", async () => {
      mockFetchAvailableModels.mock.mockImplementation(async () => { throw new Error("API error"); });

      const res = await app.inject({ method: "GET", url: "/models" });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.ok(Array.isArray(body.models));
      assert.ok(body.models.length > 0);
    });
  });

  // ── Translate ──────────────────────────────

  describe("POST /translate", () => {
    it("deve traduzir com sucesso", async () => {
      mockTranslateText.mock.mockImplementation(async () => ({
        id: "trans-1",
        sessionId: "session-1",
        sourceText: "Hello",
        detectedLanguage: "en",
        detectedLanguageName: "English",
        translations: [
          { language: "pt", languageName: "Portuguese", translatedText: "Olá" },
        ],
        model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        durationMs: 1200,
        createdAt: new Date().toISOString(),
      }));

      const res = await app.inject({
        method: "POST",
        url: "/translate",
        body: { text: "Hello", targetLanguages: ["pt"], model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" },
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.sourceText, "Hello");
      assert.equal(body.translations.length, 1);
    });

    it("deve retornar 400 se text estiver ausente", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/translate",
        body: { targetLanguages: ["pt"] },
      });

      assert.equal(res.statusCode, 400);
    });

    it("deve retornar 400 se targetLanguages estiver ausente", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/translate",
        body: { text: "Hello" },
      });

      assert.equal(res.statusCode, 400);
    });

    it("deve retornar 502 se o LLM falhar", async () => {
      mockTranslateText.mock.mockImplementation(async () => {
        throw new Error("OpenRouter 502: upstream error");
      });

      const res = await app.inject({
        method: "POST",
        url: "/translate",
        body: { text: "Hello", targetLanguages: ["pt"] },
      });

      assert.equal(res.statusCode, 502);
      const body = JSON.parse(res.body);
      assert.ok(body.error);
    });
  });

  // ── History ────────────────────────────────

  describe("GET /history", () => {
    it("deve retornar histórico com paginação", async () => {
      mockGetHistory.mock.mockImplementation(async () => ({
        total: 1,
        items: [
          {
            id: "t1",
            sessionId: "s1",
            sourceText: "Hello",
            detectedLanguage: "en",
            detectedLanguageName: "English",
            targetLanguages: ["pt"],
            model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
            durationMs: 500,
            createdAt: new Date().toISOString(),
            translations: [
              { language: "pt", languageName: "Portuguese", translatedText: "Olá" },
            ],
          },
        ],
      }));

      const res = await app.inject({ method: "GET", url: "/history?limit=10&offset=0" });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.total, 1);
      assert.equal(body.items.length, 1);
      assert.equal(body.items[0].sourceText, "Hello");
    });

    it("deve usar valores default (limit=50, offset=0)", async () => {
      mockGetHistory.mock.mockImplementation(async () => ({ total: 0, items: [] }));

      await app.inject({ method: "GET", url: "/history" });

      const args = mockGetHistory.mock.calls[0].arguments;
      assert.equal(args[0], 50);
      assert.equal(args[1], 0);
    });

    it("deve limitar o limit a 100", async () => {
      mockGetHistory.mock.mockImplementation(async () => ({ total: 0, items: [] }));

      await app.inject({ method: "GET", url: "/history?limit=999" });

      const args = mockGetHistory.mock.calls[0].arguments;
      assert.equal(args[0], 100);
    });
  });

  // ── Delete ─────────────────────────────────

  describe("DELETE /history/:id", () => {
    it("deve retornar 200 se a exclusão for bem-sucedida", async () => {
      mockDeleteTranslation.mock.mockImplementation(async () => true);

      const res = await app.inject({ method: "DELETE", url: "/history/abc-123" });
      assert.equal(res.statusCode, 200);
      assert.deepEqual(JSON.parse(res.body), { ok: true });
    });

    it("deve retornar 404 se o registro não existir", async () => {
      mockDeleteTranslation.mock.mockImplementation(async () => false);

      const res = await app.inject({ method: "DELETE", url: "/history/non-existent" });
      assert.equal(res.statusCode, 404);
      assert.equal(JSON.parse(res.body).error, "Not found");
    });
  });
});
