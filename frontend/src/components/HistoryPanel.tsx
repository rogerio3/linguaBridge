"use client";
import { useEffect, useState } from "react";
import { SpeakerButton } from "./SpeakerButton";
import type { HistoryItem } from "@/types";

interface Props {
  items:   HistoryItem[];
  total:   number;
  loading: boolean;
  onLoad:  () => void;
  onDelete:(id: string) => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return `${s}s atrás`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export function HistoryPanel({ items, total, loading, onLoad, onDelete }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { onLoad(); }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    await onDelete(id);
    setDeleting(null);
    if (expanded === id) setExpanded(null);
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-ink-muted text-sm">
        Carregando histórico…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-ink-muted">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="16" cy="16" r="14"/>
          <path d="M16 10v6l4 2"/>
        </svg>
        <span className="text-sm">Nenhuma tradução ainda</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto pr-1">
      <div className="text-xs text-ink-faint mb-3">{total} tradução{total !== 1 ? "ões" : ""} no total</div>
      {items.map(item => (
        <div
          key={item.id}
          className="bg-panel border border-divider rounded-xl overflow-hidden animate-slide-in
                     hover:border-teal/30 transition-colors"
        >
          {/* Header row */}
          <div
            className="flex items-start justify-between gap-3 px-3 py-2.5 cursor-pointer"
            onClick={() => setExpanded(expanded === item.id ? null : item.id)}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-sm text-ink truncate">{item.sourceText}</p>
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <span className="text-teal font-medium">{item.detectedLanguageName}</span>
                <span>→</span>
                <span>{item.targetLanguages.join(", ").toUpperCase()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-ink-faint">{timeAgo(item.createdAt)}</span>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                disabled={deleting === item.id}
                className="text-ink-faint hover:text-danger transition-colors disabled:opacity-40 p-1"
                aria-label="Deletar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" className="text-ink-faint"
                style={{ transform: expanded === item.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          {/* Expanded translations */}
          {expanded === item.id && (
            <div className="border-t border-divider px-3 py-2.5 flex flex-col gap-2 animate-fade-up">
              {item.translations.map(t => (
                <div key={t.language}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-teal">{t.languageName}</span>
                    <SpeakerButton text={t.translatedText} lang={t.language} />
                  </div>
                  <p className="text-xs text-ink mt-0.5 leading-relaxed">{t.translatedText}</p>
                </div>
              ))}
              <div className="flex items-center gap-3 text-xs text-ink-faint pt-1 border-t border-divider mt-1">
                <span>{item.model.split("/")[1]}</span>
                <span className="w-1 h-1 rounded-full bg-divider"/>
                <span>{item.durationMs}ms</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
