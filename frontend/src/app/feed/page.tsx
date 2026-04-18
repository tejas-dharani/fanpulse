"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEvents } from "@/lib/hooks/useEvents";
import { useFanMatch } from "@/lib/hooks/useFanMatch";
import EventCard from "@/components/EventCard";
import FanMatchCard from "@/components/FanMatchCard";
import LiveScore from "@/components/LiveScore";
import type { Loyalty } from "@/lib/types";

export default function FeedPage() {
  const router = useRouter();
  const [fanId, setFanId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loyalty, setLoyalty] = useState<Loyalty>("NEUTRAL");
  const [matchId, setMatchId] = useState("rcb_vs_dc_20260418");

  useEffect(() => {
    const id = sessionStorage.getItem("fanId");
    if (!id) { router.push("/"); return; }
    setFanId(id);
    setDisplayName(sessionStorage.getItem("displayName") || "Fan");
    setLoyalty((sessionStorage.getItem("loyalty") as Loyalty) || "NEUTRAL");
    setMatchId(sessionStorage.getItem("matchId") || "rcb_vs_dc_20260418");
  }, [router]);

  const { events, loading } = useEvents(matchId);
  const fanMatches = useFanMatch(fanId);

  const twins = fanMatches.filter((m) => m.type === "TWIN");
  const rivals = fanMatches.filter((m) => m.type === "RIVAL");

  return (
    <div className="min-h-screen bg-gray-950">
      <LiveScore matchId={matchId} />

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800">
        <div>
          <p className="text-white font-semibold text-sm">{displayName}</p>
          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
            loyalty === "RCB" ? "bg-red-900 text-red-300" :
            loyalty === "DC" ? "bg-blue-900 text-blue-300" :
            "bg-gray-800 text-gray-300"
          }`}>{loyalty}</span>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Fan connections</p>
          <p className="text-white text-sm font-bold">{fanMatches.length} matches</p>
        </div>
      </div>

      <div className="flex">
        {/* Main feed */}
        <div className="flex-1 px-4 py-3 max-w-lg">
          <h2 className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wider">Live Feed</h2>
          {loading && <p className="text-gray-500 text-sm text-center py-8">Watching the match...</p>}
          {!loading && events.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">Match about to begin. Get ready.</p>
          )}
          {events.map((event) => (
            <EventCard
              key={event.eventId}
              event={event}
              fanId={fanId}
              loyalty={loyalty}
            />
          ))}
        </div>

        {/* Fan Match sidebar */}
        <div className="w-72 border-l border-gray-800 px-4 py-3 hidden md:block">
          <h2 className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wider">Fan Connections</h2>

          {fanMatches.length === 0 && (
            <div className="text-gray-600 text-xs text-center py-4">
              React to 3+ events and Gemini will find your Fan Twin and Fan Rival.
            </div>
          )}

          {twins.length > 0 && (
            <>
              <p className="text-purple-400 text-xs font-semibold mb-2">Your Fan Twins</p>
              {twins.map((m, i) => (
                <FanMatchCard key={i} match={m} myFanId={fanId} />
              ))}
            </>
          )}

          {rivals.length > 0 && (
            <>
              <p className="text-orange-400 text-xs font-semibold mb-2 mt-3">Your Fan Rivals</p>
              {rivals.map((m, i) => (
                <FanMatchCard key={i} match={m} myFanId={fanId} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
