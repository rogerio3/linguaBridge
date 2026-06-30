import { callOpenRouter } from "./openrouter.js";
import { prisma } from "./db.js";
import type { TranslateRequest, TranslateResponse, TranslationResult } from "./types.js";

const LANGUAGE_NAMES: Record<string, string> = {
  af:"Afrikaans", sq:"Albanian", am:"Amharic", ar:"Arabic", az:"Azerbaijani",
  be:"Belarusian", bn:"Bengali", bs:"Bosnian", bg:"Bulgarian", ca:"Catalan",
  zh:"Chinese", hr:"Croatian", cs:"Czech", da:"Danish", nl:"Dutch",
  en:"English", et:"Estonian", fi:"Finnish", fr:"French", gl:"Galician",
  ka:"Georgian", de:"German", el:"Greek", gu:"Gujarati", he:"Hebrew",
  hi:"Hindi", hu:"Hungarian", id:"Indonesian", it:"Italian", ja:"Japanese",
  kn:"Kannada", kk:"Kazakh", ko:"Korean", lv:"Latvian", lt:"Lithuanian",
  mk:"Macedonian", ms:"Malay", ml:"Malayalam", mt:"Maltese", mr:"Marathi",
  my:"Burmese", ne:"Nepali", no:"Norwegian", fa:"Persian", pl:"Polish",
  pt:"Portuguese", pa:"Punjabi", ro:"Romanian", ru:"Russian", sr:"Serbian",
  sk:"Slovak", sl:"Slovenian", es:"Spanish", sw:"Swahili", sv:"Swedish",
  tl:"Filipino", ta:"Tamil", te:"Telugu", th:"Thai", tr:"Turkish",
  uk:"Ukrainian", ur:"Urdu", vi:"Vietnamese", cy:"Welsh", zu:"Zulu",
};

export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code.toLowerCase()] ?? code.toUpperCase();
}

const DEFAULT_MODEL = "openai/gpt-4o-mini";

export async function translateText(req: TranslateRequest): Promise<TranslateResponse> {
  if (!req.text?.trim()) throw new Error("'text' é obrigatório.");
  if (!req.targetLanguages?.length || req.targetLanguages.length > 3)
    throw new Error("Forneça entre 1 e 3 idiomas em 'targetLanguages'.");

  const model = req.model ?? DEFAULT_MODEL;
  const start = Date.now();

  const targetList = req.targetLanguages
    .map((c, i) => `${i + 1}. ${c} (${getLanguageName(c)})`)
    .join("\n");

  const systemPrompt = `You are a professional multilingual translator.
1. Detect the source language of the input text.
2. Translate it into each requested target language.
Respond ONLY with valid JSON — no markdown, no explanation:
{
  "detectedLanguage": "<ISO 639-1>",
  "detectedLanguageName": "<name in English>",
  "translations": [
    { "language": "<ISO 639-1>", "languageName": "<name in English>", "translatedText": "<translation>" }
  ]
}`;

  const response = await callOpenRouter({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: `Text:\n"""\n${req.text}\n"""\n\nTarget languages:\n${targetList}` },
    ],
    temperature: 0.2,
    max_tokens: 2048,
  });

  const raw = response.choices?.[0]?.message?.content ?? "";
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let parsed: { detectedLanguage: string; detectedLanguageName: string; translations: TranslationResult[] };
  try { parsed = JSON.parse(clean); }
  catch { throw new Error(`LLM returned non-JSON: ${raw}`); }

  const durationMs = Date.now() - start;

  // ── Persist to DB via Prisma ──────────────
  const result = await prisma.$transaction(async (tx) => {
    // Ensure session exists
    let sessionId = req.sessionId ?? "";
    if (sessionId) {
      const session = await tx.translationSession.findUnique({ where: { id: sessionId } });
      if (!session) sessionId = "";
    }
    if (!sessionId) {
      const session = await tx.translationSession.create({ data: {} });
      sessionId = session.id;
    }

    // Create translation record
    const translation = await tx.translation.create({
      data: {
        sessionId,
        sourceText: req.text,
        detectedLanguage: parsed.detectedLanguage,
        detectedLanguageName: parsed.detectedLanguageName,
        targetLanguages: req.targetLanguages,
        model,
        durationMs,
      },
    });

    // Create translation results
    for (const t of parsed.translations) {
      await tx.translationResult.create({
        data: {
          translationId: translation.id,
          language: t.language,
          languageName: t.languageName,
          translatedText: t.translatedText,
        },
      });
    }

    return {
      id: translation.id,
      sessionId,
      sourceText: req.text,
      detectedLanguage: parsed.detectedLanguage,
      detectedLanguageName: parsed.detectedLanguageName,
      translations: parsed.translations,
      model,
      durationMs,
      createdAt: translation.createdAt.toISOString(),
    };
  });

  return result;
}
