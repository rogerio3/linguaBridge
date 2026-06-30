"use client";
import type { LLMModel } from "@/types";

interface Props {
  models:   LLMModel[];
  value:    string;
  onChange: (id: string) => void;
  loading:  boolean;
}

export function ModelSelector({ models, value, onChange, loading }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Modelo</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={loading}
        className="bg-panel border border-divider text-ink text-sm rounded-lg px-3 py-1.5
                   focus:outline-none focus:border-teal transition-colors cursor-pointer
                   disabled:opacity-50 max-w-[220px]"
      >
        {loading
          ? <option>Carregando…</option>
          : models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)
        }
      </select>
    </div>
  );
}
