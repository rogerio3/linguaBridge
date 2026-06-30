"use client";
import { useState } from "react";
import { ModelSelector } from "@/components/ModelSelector";
import { TranslatorPanel } from "@/components/TranslatorPanel";
import { HistoryPanel }    from "@/components/HistoryPanel";
import { GlobeIcon }       from "@/components/GlobeIcon";
import { useModels }       from "@/hooks/useModels";
import { useHistory }      from "@/hooks/useHistory";
import type { HistoryItem } from "@/types";

export default function HomePage() {
  const { models, loading: modelsLoading } = useModels();
  const { items, total, loading: histLoading, load, remove, prepend } = useHistory();
  const [model,   setModel]   = useState("nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free");
  const [tab,     setTab]     = useState<"translate" | "history">("translate");

  function handleResult(item: HistoryItem) {
    prepend(item);
  }

  return (
    <div className="min-h-screen flex flex-col bg-void">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-divider bg-void/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GlobeIcon size={22} className="text-teal" />
            <span className="font-display font-bold text-base tracking-tight">
              Lingua<span className="text-gradient">Bridge</span>
            </span>
          </div>
          <ModelSelector models={models} value={model} onChange={setModel} loading={modelsLoading} />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-5 py-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">

        {/* LEFT – Translator */}
        <main>
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold tracking-tight leading-tight">
              Traduza qualquer texto<br/>
              <span className="text-gradient">em até 3 idiomas</span>
            </h1>
            <p className="text-ink-muted text-sm mt-2">
              Detecção automática · Alimentado por OpenRouter · Histórico salvo em PostgreSQL
            </p>
          </div>
          <TranslatorPanel model={model} onResult={handleResult} />
        </main>

        {/* RIGHT – Sidebar */}
        <aside className="flex flex-col">
          {/* Mobile tab nav */}
          <div className="flex lg:hidden border-b border-divider mb-4">
            {(["translate", "history"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors
                  ${tab === t ? "text-teal border-b-2 border-teal -mb-px" : "text-ink-muted"}`}>
                {t === "translate" ? "Traduzir" : "Histórico"}
              </button>
            ))}
          </div>

          <div className={`lg:block ${tab === "history" ? "block" : "hidden"} lg:flex lg:flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-sm uppercase tracking-widest text-ink-muted">
                Histórico
              </h2>
              <button
                onClick={() => load()}
                className="text-xs text-teal hover:underline"
              >
                Atualizar
              </button>
            </div>
            <HistoryPanel
              items={items} total={total} loading={histLoading}
              onLoad={load} onDelete={remove}
            />
          </div>
        </aside>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-divider text-center py-4 text-xs text-ink-faint">
        LinguaBridge v2 ·{" "}
        <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-teal hover:underline">
          OpenRouter
        </a>
      </footer>
    </div>
  );
}
