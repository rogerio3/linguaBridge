import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

// ── Tests ────────────────────────────────────────────────────

describe("getHistory", () => {
  it("deve retornar lista vazia quando não há traduções", async () => {
    const { prisma } = await import("../db.js");
    const { getHistory } = await import("../history.js");

    const mockFindMany = mock.method(prisma.translation, "findMany", async () => []);
    const mockCount = mock.method(prisma.translation, "count", async () => 0);

    const result = await getHistory(10, 0);

    assert.equal(result.total, 0);
    assert.deepEqual(result.items, []);
    assert.equal(mockFindMany.mock.calls.length, 1);
    assert.equal(mockCount.mock.calls.length, 1);

    mockFindMany.mock.restore();
    mockCount.mock.restore();
  });

  it("deve retornar traduções com resultados aninhados", async () => {
    const { prisma } = await import("../db.js");
    const { getHistory } = await import("../history.js");

    const mockTranslations = [
      {
        id: "t1", sessionId: "s1",
        sourceText: "Hello", detectedLanguage: "en",
        detectedLanguageName: "English",
        targetLanguages: ["pt"],
        model: "openai/gpt-4o-mini",
        durationMs: 1500,
        createdAt: new Date("2025-01-01T00:00:00Z"),
        results: [
          { language: "pt", languageName: "Portuguese", translatedText: "Olá" },
        ],
      },
      {
        id: "t2", sessionId: "s1",
        sourceText: "Goodbye", detectedLanguage: "en",
        detectedLanguageName: "English",
        targetLanguages: ["fr", "de"],
        model: "openai/gpt-4o-mini",
        durationMs: 2000,
        createdAt: new Date("2025-01-02T00:00:00Z"),
        results: [
          { language: "fr", languageName: "French", translatedText: "Au revoir" },
          { language: "de", languageName: "German", translatedText: "Auf Wiedersehen" },
        ],
      },
    ];

    const mockFindMany = mock.method(prisma.translation, "findMany", async () => mockTranslations);
    const mockCount = mock.method(prisma.translation, "count", async () => 2);

    const result = await getHistory(50, 0);

    assert.equal(result.total, 2);
    assert.equal(result.items.length, 2);
    assert.equal(result.items[0].translations.length, 1);
    assert.equal(result.items[0].translations[0].translatedText, "Olá");
    assert.equal(result.items[1].translations.length, 2);
    assert.equal(result.items[1].translations[1].translatedText, "Auf Wiedersehen");

    const callArgs = mockFindMany.mock.calls[0].arguments[0];
    assert.equal(callArgs.take, 50);
    assert.equal(callArgs.skip, 0);
    assert.deepEqual(callArgs.orderBy, { createdAt: "desc" });

    mockFindMany.mock.restore();
    mockCount.mock.restore();
  });

  it("deve respeitar paginação", async () => {
    const { prisma } = await import("../db.js");
    const { getHistory } = await import("../history.js");

    const mockFindMany = mock.method(prisma.translation, "findMany", async () => []);
    const mockCount = mock.method(prisma.translation, "count", async () => 0);

    await getHistory(20, 40);

    const callArgs = mockFindMany.mock.calls[0].arguments[0];
    assert.equal(callArgs.take, 20);
    assert.equal(callArgs.skip, 40);

    mockFindMany.mock.restore();
    mockCount.mock.restore();
  });
});

describe("deleteTranslation", () => {
  it("deve retornar true quando a exclusão for bem-sucedida", async () => {
    const { prisma } = await import("../db.js");
    const { deleteTranslation } = await import("../history.js");

    const mockDelete = mock.method(prisma.translation, "delete", async () => ({ id: "abc" }));

    const result = await deleteTranslation("abc");
    assert.equal(result, true);
    assert.equal(mockDelete.mock.calls.length, 1);
    assert.deepEqual(mockDelete.mock.calls[0].arguments[0], { where: { id: "abc" } });

    mockDelete.mock.restore();
  });

  it("deve retornar false quando o registro não existe", async () => {
    const { prisma } = await import("../db.js");
    const { deleteTranslation } = await import("../history.js");

    const mockDelete = mock.method(prisma.translation, "delete", async () => { throw new Error("Not found"); });

    const result = await deleteTranslation("non-existent");
    assert.equal(result, false);

    mockDelete.mock.restore();
  });
});

