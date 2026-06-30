"use client";
import { useState, useRef, useCallback } from "react";

interface Props {
  text: string;
  lang?: string;
}

export function SpeakerButton({ text, lang }: Props) {
  const [state, setState] = useState<"idle" | "speaking" | "error">("idle");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handlePlay = useCallback(() => {
    if (state === "speaking") {
      // Cancel current speech
      speechSynthesis.cancel();
      setState("idle");
      return;
    }

    // Map some language codes to BCP-47 tags for better voice selection
    const langMap: Record<string, string> = {
      en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE",
      it: "it-IT", pt: "pt-BR", ru: "ru-RU", ja: "ja-JP",
      zh: "zh-CN", ko: "ko-KR", ar: "ar-SA", nl: "nl-NL",
      pl: "pl-PL", tr: "tr-TR", sv: "sv-SE", da: "da-DK",
      fi: "fi-FI", no: "nb-NO", cs: "cs-CZ", ro: "ro-RO",
      hu: "hu-HU", vi: "vi-VN", th: "th-TH", hi: "hi-IN",
      el: "el-GR", he: "he-IL", uk: "uk-UA", ca: "ca-ES",
    };

    const utterance = new SpeechSynthesisUtterance(text);
    if (lang && langMap[lang]) {
      utterance.lang = langMap[lang];
    }
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setState("speaking");
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("error");

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [text, lang, state]);

  return (
    <button
      onClick={handlePlay}
      title={state === "speaking" ? "Parar" : state === "error" ? "Erro ao reproduzir" : "Ouvir tradução"}
      className={`text-xs border rounded-md px-2.5 py-1 transition-colors flex items-center gap-1.5
        ${state === "speaking"
          ? "border-teal bg-teal/10 text-teal"
          : state === "error"
            ? "border-danger/30 text-danger"
            : "border-divider text-ink-muted hover:border-teal hover:text-teal"
        }`}
    >
      <svg
        width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      >
        {state === "speaking" ? (
          <>
            <rect x="6" y="4" width="4" height="16" rx="1" className="animate-pulse" />
            <rect x="14" y="4" width="4" height="16" rx="1" className="animate-pulse" style={{ animationDelay: "0.15s" }} />
          </>
        ) : (
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        )}
      </svg>
      {state === "speaking" ? "Tocando…" : state === "error" ? "Erro" : "Ouvir"}
    </button>
  );
}