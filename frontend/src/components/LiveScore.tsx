"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Props { matchId: string }

export default function LiveScore({ matchId }: Props) {
  const [score, setScore] = useState<string>("Loading...");
  const [status, setStatus] = useState<string>("LIVE");

  useEffect(() => {
    if (!matchId) return;
    return onSnapshot(doc(db, "matches", matchId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        const scoreObj = d.currentScore || {};
        const scoreStr = Object.entries(scoreObj).map(([t, s]) => `${t}: ${s}`).join(" | ") || "Match Live";
        setScore(scoreStr);
        setStatus(d.status?.toUpperCase() || "LIVE");
      }
    });
  }, [matchId]);

  return (
    <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-red-400 font-bold text-sm">RCB</span>
        <span className="text-gray-400 text-xs">vs</span>
        <span className="text-blue-400 font-bold text-sm">DC</span>
      </div>
      <span className="text-white text-sm font-mono">{score}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded ${status === "LIVE" ? "bg-red-600 text-white animate-pulse" : "bg-gray-600 text-gray-300"}`}>
        {status}
      </span>
    </div>
  );
}
