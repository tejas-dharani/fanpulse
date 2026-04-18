"use client";
import { useState } from "react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useVerdict } from "@/lib/hooks/useVerdict";
import type { Loyalty } from "@/lib/types";

interface Props { eventId: string; fanId: string; loyalty: Loyalty }

const OPTIONS = [
  { key: "YES", label: "Yes", emoji: "✅" },
  { key: "NO", label: "No", emoji: "❌" },
  { key: "CLOSE_CALL", label: "Close Call", emoji: "🤔" },
] as const;

export default function VerdictVote({ eventId, fanId, loyalty }: Props) {
  const verdict = useVerdict(eventId);
  const [voted, setVoted] = useState<string | null>(null);

  if (!verdict) return null;

  const totalVotes = OPTIONS.reduce((sum, opt) => {
    return sum + Object.values(verdict.votes[opt.key] || {}).reduce((a, b) => a + b, 0);
  }, 0);

  async function handleVote(option: "YES" | "NO" | "CLOSE_CALL") {
    if (voted) return;
    setVoted(option);
    try {
      await updateDoc(doc(db, "verdicts", eventId), {
        [`votes.${option}.${loyalty}`]: increment(1),
      });
    } catch (e) {
      console.error("Vote error:", e);
    }
  }

  return (
    <div id="verdict" className="bg-orange-950 border border-orange-700 rounded-xl p-4 mb-4">
      <p className="text-orange-300 font-semibold text-sm mb-3">⚖️ Fan Verdict: {verdict.question}</p>

      <div className="flex gap-2 mb-4">
        {OPTIONS.map((opt) => {
          const count = Object.values(verdict.votes[opt.key] || {}).reduce((a, b) => a + b, 0);
          const pct = totalVotes > 0 ? Math.round(count / totalVotes * 100) : 0;
          return (
            <button
              key={opt.key}
              onClick={() => handleVote(opt.key)}
              disabled={!!voted}
              className={`flex-1 flex flex-col items-center py-2 rounded-lg text-sm transition-all border ${
                voted === opt.key
                  ? "bg-orange-600 border-orange-400 text-white font-bold"
                  : voted
                  ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-800 border-gray-600 hover:border-orange-600 text-white cursor-pointer"
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-xs font-medium">{opt.label}</span>
              {voted && <span className="text-xs text-gray-400">{pct}%</span>}
            </button>
          );
        })}
      </div>

      {/* Split by loyalty */}
      {voted && (
        <div className="space-y-1 text-xs">
          {OPTIONS.map((opt) => {
            const rcb = verdict.votes[opt.key]?.RCB || 0;
            const dc = verdict.votes[opt.key]?.DC || 0;
            return (
              <div key={opt.key} className="flex justify-between text-gray-400">
                <span>{opt.label}:</span>
                <span><span className="text-red-400">RCB {rcb}</span> / <span className="text-blue-400">DC {dc}</span></span>
              </div>
            );
          })}
          {verdict.geminiAnalysis && (
            <p className="text-yellow-300 italic mt-2">"{verdict.geminiAnalysis}"</p>
          )}
        </div>
      )}
    </div>
  );
}
