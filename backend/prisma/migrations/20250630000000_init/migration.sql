-- CreateTable
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "translation_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "source_text" TEXT NOT NULL,
    "detected_language" VARCHAR(16) NOT NULL,
    "detected_language_name" VARCHAR(64) NOT NULL,
    "target_languages" TEXT[],
    "model" VARCHAR(128) NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "translation_id" UUID NOT NULL,
    "language" VARCHAR(16) NOT NULL,
    "language_name" VARCHAR(64) NOT NULL,
    "translated_text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translation_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_translations_session" ON "translations"("session_id");

-- CreateIndex
CREATE INDEX "idx_translations_created" ON "translations"("created_at");

-- CreateIndex
CREATE INDEX "idx_results_translation" ON "translation_results"("translation_id");

-- AddForeignKey
ALTER TABLE "translations" ADD CONSTRAINT "translations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "translation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_results" ADD CONSTRAINT "translation_results_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
