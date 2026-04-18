"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MatchEvent } from "@/lib/types";

export function useEvents(matchId: string, count = 20) {
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    const q = query(
      collection(db, "events"),
      orderBy("timestamp", "desc"),
      limit(count)
    );
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ ...d.data(), eventId: d.id } as MatchEvent)));
      setLoading(false);
    });
    return unsub;
  }, [matchId, count]);

  return { events, loading };
}
