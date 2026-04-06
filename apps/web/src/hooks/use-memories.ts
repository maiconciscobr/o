import { useState, useEffect, useCallback } from "react";
import { memories as api, type Memory } from "../lib/api";

export function useMemories() {
  const [items, setItems] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.list();
      setItems(data);
    } catch {
      // silent — server might not be ready
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (content: string, category?: string, importance?: number) => {
    const memory = await api.create({ content, category, importance });
    setItems((prev) => [memory, ...prev]);
    return memory;
  };

  const remove = async (id: string) => {
    await api.delete(id);
    setItems((prev) => prev.filter((m) => m.id !== id));
  };

  const update = async (id: string, data: Partial<Memory>) => {
    await api.update(id, data);
    setItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...data } : m)),
    );
  };

  // Group by category
  const grouped = items.reduce<Record<string, Memory[]>>((acc, m) => {
    const cat = m.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  return { items, grouped, loading, add, remove, update, refresh };
}
