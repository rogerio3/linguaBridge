import { prisma } from "./db.js";
import type { HistoryItem } from "./types.js";

export async function getHistory(limit = 50, offset = 0): Promise<{ items: HistoryItem[]; total: number }> {
  const [items, total] = await Promise.all([
    prisma.translation.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        results: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.translation.count(),
  ]);

  return {
    total,
    items: items.map((t) => ({
      id:                   t.id,
      sessionId:            t.sessionId,
      sourceText:           t.sourceText,
      detectedLanguage:     t.detectedLanguage,
      detectedLanguageName: t.detectedLanguageName,
      targetLanguages:      t.targetLanguages,
      model:                t.model,
      durationMs:           t.durationMs,
      createdAt:            t.createdAt.toISOString(),
      translations:         t.results.map((r) => ({
        language:       r.language,
        languageName:   r.languageName,
        translatedText: r.translatedText,
      })),
    })),
  };
}

export async function deleteTranslation(id: string): Promise<boolean> {
  try {
    await prisma.translation.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
