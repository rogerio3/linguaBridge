"use client";
import { LANGUAGES } from "@/types";

interface Props {
  label:    string;
  value:    string;
  onChange: (v: string) => void;
  exclude?: string[];
  optional?: boolean;
}

export function LanguageSelect({ label, value, onChange, exclude = [], optional }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-void border border-divider text-ink text-sm rounded-lg px-3 py-2
                   focus:outline-none focus:border-teal transition-colors cursor-pointer w-full"
      >
        {optional && <option value="">Opcional</option>}
        {LANGUAGES.filter(l => !exclude.includes(l.code) || l.code === value).map(l => (
          <option key={l.code} value={l.code}>{l.name}</option>
        ))}
      </select>
    </div>
  );
}
