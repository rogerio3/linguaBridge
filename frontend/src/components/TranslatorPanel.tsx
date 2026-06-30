"use client";
import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { LanguageSelect } from "./LanguageSelect";
import { GlobeIcon } from "./GlobeIcon";
import type { TranslateResponse, HistoryItem } from "@/types";

interface Props {
  model:    string;
  onResult: (item: HistoryItem) => void;
}

const MAX_CHARS = 10000;

export function TranslatorPanel({ model, onResult }: Props) {
  const [text,        setText]        = useState("");
  const [lang1,       setLang1]       = useState("en");
  const [lang2,       setLang2]       = useState("es");
  const [lang3,       setLang3]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<TranslateResponse | null>(null);
  const [error,       setError]       = useState("");
  const [copied,      setCopied]      = useState<string | null>(null);
  const sessionRef = useRef<string | undefined>(undefined);

  const targetLangs = [lang1, lang2, lang3].filter(Boolean);

  async function handleTranslate() {
    if (!text.trim() || targetLangs.length === 0) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.translate({
        text, targetLanguages: targetLangs, model,
        sessionId: sessionRef.current,
      });
      sessionRef.current = res.sessionId;
      setResult(res);
      // feed history – cast to HistoryItem (targetLanguages added)
      onResult({ ...res, targetLanguages: targetLangs });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function copy(txt: string, key: string) {
    await navigator.clipboard.writeText(txt).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }

  const excludeFromOthers = (self: string) =>
    [lang1, lang2, lang3].filter(v => v && v !== self);

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Input */}
      <div className={`relative bg-panel border rounded-xl p-4 transition-colors
                       ${loading ? "border-teal animate-pulse-teal" : "border-divider focus-within:border-teal"}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Texto de entrada</span>
          {result && (
            <span className="text-xs font-semibold bg-teal/10 text-teal border border-teal/30 rounded-full px-3 py-0.5">
              Detectado: {result.detectedLanguageName} ({result.detectedLanguage.toUpperCase()})
            </span>
          )}
        </div>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value.slice(0, MAX_CHARS)); setResult(null); setError(""); }}
          placeholder="Cole ou escreva o texto aqui…"
          rows={7}
          className="w-full bg-transparent text-ink text-sm leading-relaxed resize-none
                     focus:outline-none placeholder:text-ink-faint"
        />
        <div className={`text-right text-xs mt-2 ${text.length > 9000 ? "text-danger" : "text-ink-faint"}`}>
          {text.length.toLocaleString("pt-BR")} / {MAX_CHARS.toLocaleString("pt-BR")}
        </div>
      </div>

      {/* Language selectors */}
      <div className="bg-panel border border-divider rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Idiomas de saída</span>
          <span className="text-xs text-ink-faint">até 3 idiomas</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <LanguageSelect label="Idioma 1" value={lang1} onChange={setLang1} exclude={excludeFromOthers(lang1)} />
          <LanguageSelect label="Idioma 2" value={lang2} onChange={setLang2} exclude={excludeFromOthers(lang2)} />
          <LanguageSelect label="Idioma 3" value={lang3} onChange={setLang3} exclude={excludeFromOthers(lang3)} optional />
        </div>
      </div>

      {/* Translate button */}
      <button
        onClick={handleTranslate}
        disabled={loading || !text.trim() || targetLangs.length === 0}
        className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl
                   font-display font-semibold text-sm tracking-wide transition-all
                   bg-teal text-void hover:bg-teal-dim hover:-translate-y-px hover:shadow-lg
                   disabled:bg-rim disabled:text-ink-faint disabled:translate-y-0 disabled:shadow-none
                   disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <GlobeIcon size={18} spinning className="text-void" />
            <span>Traduzindo…</span>
          </>
        ) : (
          <>
            <GlobeIcon size={18} className="text-void" />
            <span>Traduzir</span>
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 text-red-300 rounded-xl px-4 py-3 text-sm animate-fade-up">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-3 animate-fade-up">
          {result.translations.map((t, i) => (
            <div key={t.language} className="bg-panel border border-divider rounded-xl overflow-hidden"
                 style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between px-4 py-3 bg-void border-b border-divider">
                <span className="font-display font-semibold text-teal text-sm">
                  {t.languageName} <span className="text-ink-faint font-body font-normal">({t.language.toUpperCase()})</span>
                </span>
                <button
                  onClick={() => copy(t.translatedText, t.language)}
                  className="text-xs text-ink-muted border border-divider rounded-md px-2.5 py-1
                             hover:border-teal hover:text-teal transition-colors"
                >
                  {copied === t.language ? "Copiado ✓" : "Copiar"}
                </button>
              </div>
              <p className="px-4 py-3 text-sm text-ink leading-relaxed whitespace-pre-wrap">{t.translatedText}</p>
              {i === result.translations.length - 1 && (
                <div className="flex items-center gap-3 px-4 py-2 border-t border-divider text-xs text-ink-faint">
                  <span>{result.model.split("/")[1]}</span>
                  <span className="w-1 h-1 rounded-full bg-divider" />
                  <span>{result.durationMs.toLocaleString("pt-BR")} ms</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
