"use client";

import { useCallback, useEffect, useState } from "react";
import { getDemoTickets, TICKETS_EVENT } from "@/app/lib/demo-store";
import type { Ticket } from "@/app/types/ticket";

export default function useDemoTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    try {
      setTickets(getDemoTickets());
      setError("");
    } catch {
      setError("Unable to read saved demo tickets in this browser.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(refresh, 0);
    window.addEventListener(TICKETS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearTimeout(initialRefresh);
      window.removeEventListener(TICKETS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return { tickets, loading, error, refresh };
}
