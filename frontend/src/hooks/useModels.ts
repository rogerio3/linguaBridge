"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { LLMModel } from "@/types";

export function useModels() {
  const [models, setModels]   = useState<LLMModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.models()
      .then(r => setModels(r.models))
      .catch(() => setModels([{ id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", name: "GPT-4o Mini" }]))
      .finally(() => setLoading(false));
  }, []);

  return { models, loading };
}
