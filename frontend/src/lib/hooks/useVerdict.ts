"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Verdict } from "@/lib/types";

export function useVerdict(eventId: string) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const unsub = onSnapshot(doc(db, "verdicts", eventId), (snap) => {
      setVerdict(snap.exists() ? (snap.data() as Verdict) : null);
    });
    return unsub;
  }, [eventId]);

  return verdict;
}
