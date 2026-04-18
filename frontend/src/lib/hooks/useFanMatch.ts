"use client";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FanMatch } from "@/lib/types";

export function useFanMatch(fanId: string) {
  const [matches, setMatches] = useState<FanMatch[]>([]);

  useEffect(() => {
    if (!fanId) return;
    const q = query(
      collection(db, "fan_matches"),
      where("fan1Id", "==", fanId)
    );
    const q2 = query(
      collection(db, "fan_matches"),
      where("fan2Id", "==", fanId)
    );

    const results: Record<string, FanMatch> = {};

    const unsub1 = onSnapshot(q, (snap) => {
      snap.docs.forEach((d) => { results[d.id] = d.data() as FanMatch; });
      setMatches(Object.values(results));
    });
    const unsub2 = onSnapshot(q2, (snap) => {
      snap.docs.forEach((d) => { results[d.id] = d.data() as FanMatch; });
      setMatches(Object.values(results));
    });

    return () => { unsub1(); unsub2(); };
  }, [fanId]);

  return matches;
}
