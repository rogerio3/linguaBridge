"use client";
import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { HistoryItem } from "@/types";

export function useHistory() {
  const [items,   setItems]   = useState<HistoryItem[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (limit = 50, offset = 0) => {
    setLoading(true);
    try {
      const r = await api.history(limit, offset);
      setItems(r.items);
      setTotal(r.total);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.deleteTranslation(id);
    setItems(prev => prev.filter(i => i.id !== id));
    setTotal(prev => prev - 1);
  }, []);

  const prepend = useCallback((item: HistoryItem) => {
    setItems(prev => [item, ...prev]);
    setTotal(prev => prev + 1);
  }, []);

  return { items, total, loading, load, remove, prepend };
}
