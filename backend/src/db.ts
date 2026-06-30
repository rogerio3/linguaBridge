import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function runMigrations(): Promise<void> {
  const { execSync } = await import("child_process");
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit", cwd: process.cwd() });
    console.log("[db] Prisma migrations applied ✓");
  } catch (err) {
    console.error("[db] Prisma migration failed:", err);
    throw err;
  }
}

export async function waitForDb(retries = 15, delay = 2000): Promise<void> {
  for (let i = 1; i <= retries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("[db] Connected to PostgreSQL ✓");
      return;
    } catch {
      console.log(`[db] Waiting for database… attempt ${i}/${retries}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("Could not connect to database after multiple retries.");
}
