import Fastify from "fastify";
import { config } from "./config.js";
import { waitForDb } from "./db.js";
import { registerRoutes } from "./routes.js";

async function bootstrap(): Promise<void> {
  if (!config.openrouterApiKey || config.openrouterApiKey.includes("COLOQUE")) {
    console.error("\n⚠️  OPENROUTER_API_KEY não configurada em .env\n");
    process.exit(1);
  }

  // Wait for Postgres (important inside Docker)
  await waitForDb();

  const app = Fastify({ logger: true });

  // CORS
  app.addHook("onRequest", async (_req, reply) => {
    reply.header("Access-Control-Allow-Origin",  "*");
    reply.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
  });
  app.options("*", async (_req, reply) => reply.send());

  await registerRoutes(app);

  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`\n🌐  API → http://localhost:${config.port}\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
