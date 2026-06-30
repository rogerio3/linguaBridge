import type { FastifyInstance } from "fastify";
import { translateText } from "./translate.js";
import { getHistory, deleteTranslation } from "./history.js";
import { fetchAvailableModels } from "./openrouter.js";
import type { TranslateRequest } from "./types.js";

const CURATED_MODELS = [
  // { id: "openai/gpt-4o-mini",                       name: "GPT-4o Mini"               },
  // { id: "openai/gpt-4o",                            name: "GPT-4o"                    },
  // { id: "anthropic/claude-3-haiku",                 name: "Claude 3 Haiku"            },
  // { id: "anthropic/claude-3.5-sonnet",              name: "Claude 3.5 Sonnet"         },
  // { id: "google/gemini-flash-1.5",                  name: "Gemini Flash 1.5"          },
  // { id: "google/gemini-pro-1.5",                    name: "Gemini Pro 1.5"            },
  // { id: "meta-llama/llama-3.1-8b-instruct:free",    name: "Llama 3.1 8B (Free)"       },
  // { id: "meta-llama/llama-3.1-70b-instruct",        name: "Llama 3.1 70B"             },
  // { id: "mistralai/mistral-7b-instruct:free",        name: "Mistral 7B (Free)"         },
  // { id: "mistralai/mixtral-8x7b-instruct",           name: "Mixtral 8x7B"              },
  // { id: "deepseek/deepseek-chat",                    name: "DeepSeek Chat"             },
  // { id: "qwen/qwen-2.5-72b-instruct",                name: "Qwen 2.5 72B"              },
  // { id: "qwen/qwen-2.5-72b-instruct",                name: "Qwen 2.5 72B"              },
  // { id: "qwen/qwen-2.5-72b-instruct",                name: "Qwen 2.5 72B"              },
  // { id: "qwen/qwen-2.5-72b-instruct",                name: "Qwen 2.5 72B"              },
  { id: "cohere/north-mini-code:free",                name: "cohere mini-code:free"              },
  { id: "nvidia/llama-nemotron-rerank-vl-1b-v2:free", name: "llama-nemotron-rerank-vl-1b-v2:free"              },
  { id: "nvidia/nemotron-3.5-content-safety:free",                name: "nemotron-3.5-content-safety:free"              },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free",                name: "nemotron-3-ultra-550b-a55b:free"              },
  { id: "openrouter/owl-alpha",                name: "openrouter/owl-alpha"              },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",                name: "nemotron-3-nano-omni-30b-a3b-reasoning:free"              },
  { id: "poolside/laguna-xs.2:free",                name: "poolside/laguna-xs.2:free"              },
  { id: "poolside/laguna-m.1:free",                name: "poolside/laguna-m.1:free"              },
  { id: "google/gemma-4-26b-a4b-it:free",                name: "google/gemma-4-26b-a4b-it:free"              },
  { id: "google/gemma-4-31b-it:free",                name: "google/gemma-4-31b-it:free"              },
  { id: "nvidia/nemotron-3-super-120b-a12b:free",                name: "nvidia/nemotron-3-super-120b-a12b:free"              },
  { id: "liquid/lfm-2.5-1.2b-thinking:free",                name: "liquid/lfm-2.5-1.2b-thinking:free"              },
  { id: "nvidia/nemotron-3-nano-30b-a3b:free",                name: "nvidia/nemotron-3-nano-30b-a3b:free"              },
];

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // ── Health ──────────────────────────────
  app.get("/health", async () => ({ status: "ok", ts: new Date().toISOString() }));

  // ── Models ──────────────────────────────
  app.get("/models", async (_req, reply) => {
    try {
      const all = await fetchAvailableModels();
      const available = new Set(all.map(m => m.id));
      const list = CURATED_MODELS.filter(m => available.has(m.id));
      return reply.send({ models: list.length ? list : CURATED_MODELS });
    } catch {
      return reply.send({ models: CURATED_MODELS });
    }
  });

  // ── Translate ───────────────────────────
  app.post<{ Body: TranslateRequest }>("/translate", {
    schema: {
      body: {
        type: "object",
        required: ["text", "targetLanguages"],
        properties: {
          text:            { type: "string", minLength: 1, maxLength: 10000 },
          targetLanguages: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
          model:           { type: "string" },
          sessionId:       { type: "string" },
        },
      },
    },
  }, async (req, reply) => {
    try {
      return reply.send(await translateText(req.body));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isVal = /obrigatório|Forneça/.test(msg);
      return reply.status(isVal ? 400 : 502).send({ error: msg });
    }
  });

  // ── History ─────────────────────────────
  app.get<{ Querystring: { limit?: string; offset?: string } }>("/history", async (req, reply) => {
    const limit  = Math.min(Number(req.query.limit  ?? 50), 100);
    const offset = Number(req.query.offset ?? 0);
    return reply.send(await getHistory(limit, offset));
  });

  // ── Delete ──────────────────────────────
  app.delete<{ Params: { id: string } }>("/history/:id", async (req, reply) => {
    const ok = await deleteTranslation(req.params.id);
    return ok ? reply.send({ ok: true }) : reply.status(404).send({ error: "Not found" });
  });
}
