"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, signInAnon } from "@/lib/firebase";
import type { Loyalty } from "@/lib/types";

const MATCH_ID = process.env.NEXT_PUBLIC_MATCH_ID || "549ba395-31e9-477b-ba2c-a2a0dd1cbec9";

const TEAMS: { loyalty: Loyalty; label: string; color: string; bg: string; border: string; emoji: string }[] = [
  { loyalty: "RCB", label: "Royal Challengers Bengaluru", color: "text-red-400", bg: "bg-red-900/30", border: "border-red-600 hover:border-red-400", emoji: "🔴" },
  { loyalty: "DC", label: "Delhi Capitals", color: "text-blue-400", bg: "bg-blue-900/30", border: "border-blue-600 hover:border-blue-400", emoji: "🔵" },
  { loyalty: "NEUTRAL", label: "Just here for the cricket", color: "text-gray-400", bg: "bg-gray-800/30", border: "border-gray-600 hover:border-gray-400", emoji: "⚪" },
];

export default function TeamPickerClient() {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Loyalty | null>(null);
  const router = useRouter();

  async function pickTeam(loyalty: Loyalty) {
    setSelected(loyalty);
    setLoading(true);
    try {
      const user = await signInAnon();
      const suffix = Math.floor(Math.random() * 99) + 1;
      const displayName = `${loyalty}_Fan_${suffix}`;
      await setDoc(doc(db, "fans", user.uid), {
        fanId: user.uid, displayName, loyalty,
        reactionHistory: [], matchedWith: [], isDemo: false,
        matchId: MATCH_ID, joinedAt: serverTimestamp(),
      });
      sessionStorage.setItem("fanId", user.uid);
      sessionStorage.setItem("displayName", displayName);
      sessionStorage.setItem("loyalty", loyalty);
      sessionStorage.setItem("matchId", MATCH_ID);
      router.push("/feed");
    } catch (e) {
      console.error(e);
      setLoading(false);
      setSelected(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">🏏</div>
        <h1 className="text-4xl font-bold text-white mb-2">FanPulse</h1>
        <p className="text-gray-400 text-lg">Who are you cheering for tonight?</p>
        <p className="text-gray-600 text-sm mt-1">RCB vs DC • Live Match</p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        {TEAMS.map((team) => (
          <button
            key={team.loyalty}
            onClick={() => pickTeam(team.loyalty)}
            disabled={loading}
            className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl border-2 transition-all duration-200 ${team.bg} ${team.border} ${
              selected === team.loyalty ? "scale-105" : loading ? "opacity-40 cursor-not-allowed" : "opacity-90 hover:opacity-100"
            }`}
          >
            <span className="text-3xl">{team.emoji}</span>
            <div className="text-left">
              <p className={`font-bold text-lg ${team.color}`}>{team.loyalty}</p>
              <p className="text-gray-400 text-sm">{team.label}</p>
            </div>
            {selected === team.loyalty && <span className="ml-auto">⏳</span>}
          </button>
        ))}
      </div>
      <p className="mt-8 text-gray-600 text-xs">No account needed. You&apos;re in instantly.</p>
    </div>
  );
}
