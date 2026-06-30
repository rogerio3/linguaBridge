const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  models: () =>
    apiFetch<{ models: Array<{ id: string; name: string }> }>("/models"),

  translate: (body: {
    text:            string;
    targetLanguages: string[];
    model:           string;
    sessionId?:      string;
  }) => apiFetch<import("@/types").TranslateResponse>("/translate", {
    method: "POST",
    body:   JSON.stringify(body),
  }),

  history: (limit = 50, offset = 0) =>
    apiFetch<{ items: import("@/types").HistoryItem[]; total: number }>(
      `/history?limit=${limit}&offset=${offset}`
    ),

  deleteTranslation: (id: string) =>
    apiFetch<{ ok: boolean }>(`/history/${id}`, { method: "DELETE" }),
};
