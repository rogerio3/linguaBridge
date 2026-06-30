export interface TranslationResult {
  language:       string;
  languageName:   string;
  translatedText: string;
}

export interface TranslateResponse {
  id:                   string;
  sessionId:            string;
  sourceText:           string;
  detectedLanguage:     string;
  detectedLanguageName: string;
  translations:         TranslationResult[];
  model:                string;
  durationMs:           number;
  createdAt:            string;
}

export interface HistoryItem extends TranslateResponse {
  targetLanguages: string[];
}

export interface LLMModel {
  id:   string;
  name: string;
}

export const LANGUAGES = [
  { code: "af", name: "Afrikaans"   }, { code: "sq", name: "Albanês"       },
  { code: "ar", name: "Árabe"       }, { code: "az", name: "Azerbaijano"   },
  { code: "bn", name: "Bengali"     }, { code: "bg", name: "Búlgaro"       },
  { code: "ca", name: "Catalão"     }, { code: "zh", name: "Chinês"        },
  { code: "hr", name: "Croata"      }, { code: "cs", name: "Tcheco"        },
  { code: "da", name: "Dinamarquês" }, { code: "nl", name: "Holandês"      },
  { code: "en", name: "Inglês"      }, { code: "et", name: "Estoniano"     },
  { code: "fi", name: "Finlandês"   }, { code: "fr", name: "Francês"       },
  { code: "de", name: "Alemão"      }, { code: "el", name: "Grego"         },
  { code: "he", name: "Hebraico"    }, { code: "hi", name: "Hindi"         },
  { code: "hu", name: "Húngaro"     }, { code: "id", name: "Indonésio"     },
  { code: "it", name: "Italiano"    }, { code: "ja", name: "Japonês"       },
  { code: "ko", name: "Coreano"     }, { code: "lv", name: "Letão"         },
  { code: "lt", name: "Lituano"     }, { code: "ms", name: "Malaio"        },
  { code: "ne", name: "Nepalês"     }, { code: "no", name: "Norueguês"     },
  { code: "fa", name: "Persa"       }, { code: "pl", name: "Polonês"       },
  { code: "pt", name: "Português"   }, { code: "pa", name: "Punjabi"       },
  { code: "ro", name: "Romeno"      }, { code: "ru", name: "Russo"         },
  { code: "sr", name: "Sérvio"      }, { code: "sk", name: "Eslovaco"      },
  { code: "sl", name: "Esloveno"    }, { code: "es", name: "Espanhol"      },
  { code: "sw", name: "Suaíli"      }, { code: "sv", name: "Sueco"         },
  { code: "tl", name: "Filipino"    }, { code: "ta", name: "Tamil"         },
  { code: "te", name: "Telugu"      }, { code: "th", name: "Tailandês"     },
  { code: "tr", name: "Turco"       }, { code: "uk", name: "Ucraniano"     },
  { code: "ur", name: "Urdu"        }, { code: "vi", name: "Vietnamita"    },
  { code: "cy", name: "Galês"       }, { code: "zu", name: "Zulu"          },
] as const;
