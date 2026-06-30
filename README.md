# LinguaBridge v2

Tradutor multilíngue com IA, Next.js 14, Fastify, PostgreSQL e Docker Compose.

## Stack
| Camada    | Tecnologia                              |
|-----------|-----------------------------------------|
| Frontend  | Next.js 14, TypeScript, Tailwind CSS    |
| Backend   | Fastify 4, TypeScript, `pg` (nativo)    |
| Database  | PostgreSQL 16 (Docker)                  |
| LLM       | OpenRouter (multi-modelo)               |

## Início rápido

```bash
# 1. Configure sua chave
edit linguabridge/.env   # OPENROUTER_API_KEY=sk-or-v1-...

# 2. Suba tudo
cd linguabridge
docker compose up --build

# 3. Acesse
open http://localhost:3000
```

## Endpoints da API
| Método | Rota           | Descrição                      |
|--------|----------------|--------------------------------|
| GET    | /health        | Health check                   |
| GET    | /models        | Lista modelos disponíveis      |
| POST   | /translate     | Traduz texto (salva no DB)     |
| GET    | /history       | Histórico de traduções         |
| DELETE | /history/:id   | Remove uma tradução            |

## Estrutura
```
linguabridge/
├── .env                   ← configure aqui
├── docker-compose.yml
├── db/migrations/
│   └── 001_init.sql
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── config.ts      ← lê .env sem libs extras
│   │   ├── db.ts          ← pool pg + migrations
│   │   ├── openrouter.ts  ← https nativo
│   │   ├── translate.ts   ← lógica + persistência
│   │   ├── history.ts     ← queries de histórico
│   │   ├── routes.ts      ← rotas Fastify
│   │   └── index.ts
└── frontend/
    ├── Dockerfile
    └── src/
        ├── app/           ← Next.js App Router
        ├── components/    ← TranslatorPanel, HistoryPanel…
        ├── hooks/         ← useModels, useHistory
        ├── lib/api.ts     ← cliente da API
        └── types/
```
# linguaBridge
# linguaBridge
