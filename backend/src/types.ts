export interface TranslateRequest {
  text:            string;
  targetLanguages: string[];
  model?:          string;
  sessionId?:      string;
}

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

export interface HistoryItem {
  id:                   string;
  sessionId:            string;
  sourceText:           string;
  detectedLanguage:     string;
  detectedLanguageName: string;
  targetLanguages:      string[];
  model:                string;
  durationMs:           number;
  createdAt:            string;
  translations:         TranslationResult[];
}

export interface OpenRouterMessage {
  role:    "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequest {
  model:       string;
  messages:    OpenRouterMessage[];
  temperature?: number;
  max_tokens?:  number;
}

export interface OpenRouterResponse {
  id:      string;
  model:   string;
  choices: Array<{ message: { role: string; content: string }; finish_reason: string }>;
}
