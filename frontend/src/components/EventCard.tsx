"use client";
import { useState } from "react";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MatchEvent, Loyalty, ReactionType } from "@/lib/types";
import Link from "next/link";

const EVENT_ICONS: Record<string, string> = {
  WICKET: "⚡", SIX: "🏏", FOUR: "🎯", FIFTY: "🌟", HUNDRED: "💯",
  OVER_COMPLETE: "🔄", MATCH_START: "🏁", MATCH_END: "🏆",
};

const RCB_REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "PUMPED", emoji: "🔥", label: "Pumped" },
  { type: "GUTTED", emoji: "😭", label: "Gutted" },
  { type: "FURIOUS", emoji: "😤", label: "Furious" },
  { type: "PROUD", emoji: "🙌", label: "Proud" },
];
const DC_REACTIONS = RCB_REACTIONS;
const NEUTRAL_REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "WOW", emoji: "🤯", label: "Wow" },
  { type: "BRILLIANT", emoji: "👏", label: "Brilliant" },
  { type: "INTERESTING", emoji: "🤔", label: "Interesting" },
  { type: "INTENSE", emoji: "⚡", label: "Intense" },
];

interface Props {
  event: MatchEvent;
  fanId: string;
  loyalty: Loyalty;
}

export default function EventCard({ event, fanId, loyalty }: Props) {
  const [reacted, setReacted] = useState<string | null>(null);

  const reactions =
    loyalty === "RCB" ? RCB_REACTIONS
    : loyalty === "DC" ? DC_REACTIONS
    : NEUTRAL_REACTIONS;

  const totalReactions = Object.values(event.reactionCounts || {}).reduce((a, b) => a + b, 0);

  async function handleReact(type: ReactionType) {
    if (reacted) return;
    setReacted(type);
    const key = `${type}_${loyalty}`;
    try {
      await updateDoc(doc(db, "events", event.eventId), {
        [`reactionCounts.${key}`]: increment(1),
      });
      await addDoc(collection(db, "reactions"), {
        eventId: event.eventId,
        fanId,
        loyalty,
        reactionType: type,
        timestamp: serverTimestamp(),
      });
      // Update fan reaction history
      await updateDoc(doc(db, "fans", fanId), {
        reactionHistory: arrayUnion(`${event.eventId}:${type}`),
      });
    } catch (e) {
      console.error("Reaction error:", e);
    }
  }

  const rcbCount = Object.entries(event.reactionCounts || {})
    .filter(([k]) => k.endsWith("_RCB")).reduce((a, [, v]) => a + v, 0);
  const dcCount = Object.entries(event.reactionCounts || {})
    .filter(([k]) => k.endsWith("_DC")).reduce((a, [, v]) => a + v, 0);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-3 hover:border-gray-500 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{EVENT_ICONS[event.type] || "📌"}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
          event.type === "WICKET" ? "bg-red-900 text-red-300" :
          event.type === "SIX" ? "bg-purple-900 text-purple-300" :
          event.type === "FOUR" ? "bg-blue-900 text-blue-300" :
          "bg-gray-700 text-gray-300"
        }`}>{event.type}</span>
        <span className="text-gray-400 text-xs ml-auto">Over {event.over}</span>
      </div>

      {event.player && (
        <p className="text-white font-semibold text-sm mb-1">{event.player} — {event.scoreAfter}</p>
      )}

      {event.fanPulse && (
        <p className="text-yellow-300 text-sm italic mb-2">"{event.fanPulse}"</p>
      )}

      {event.contextSummary && (
        <p className="text-gray-400 text-xs mb-3">{event.contextSummary}</p>
      )}

      {/* Reactions */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {reactions.map((r) => (
          <button
            key={r.type}
            onClick={() => handleReact(r.type)}
            disabled={!!reacted}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
              reacted === r.type
                ? "bg-yellow-500 text-black font-bold scale-110"
                : reacted
                ? "bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
                : "bg-gray-700 hover:bg-gray-600 text-white cursor-pointer"
            }`}
          >
            <span>{r.emoji}</span>
            <span className="text-xs">{r.label}</span>
            <span className="text-xs text-gray-400 ml-1">
              {(event.reactionCounts?.[`${r.type}_${loyalty}`] || 0)}
            </span>
          </button>
        ))}
      </div>

      {/* Fan Pulse bar */}
      {(rcbCount + dcCount) > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span className="text-red-400">RCB {rcbCount}</span>
            <span className="text-gray-500">{totalReactions} total reactions</span>
            <span className="text-blue-400">DC {dcCount}</span>
          </div>
          <div className="flex h-1.5 rounded overflow-hidden">
            <div className="bg-red-500" style={{ width: `${rcbCount / Math.max(rcbCount + dcCount, 1) * 100}%` }} />
            <div className="bg-blue-500" style={{ width: `${dcCount / Math.max(rcbCount + dcCount, 1) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Link
          href={`/event/${event.eventId}`}
          className="flex-1 text-center text-xs text-gray-300 border border-gray-600 rounded-lg py-1.5 hover:bg-gray-700 transition-colors"
        >
          Discuss
        </Link>
        {event.isVerdictWorthy && (
          <Link
            href={`/event/${event.eventId}#verdict`}
            className="flex-1 text-center text-xs text-orange-300 border border-orange-700 rounded-lg py-1.5 hover:bg-orange-900 transition-colors"
          >
            Verdict
          </Link>
        )}
      </div>
    </div>
  );
}
