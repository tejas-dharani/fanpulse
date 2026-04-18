"use client";
import Link from "next/link";
import type { FanMatch } from "@/lib/types";

interface Props {
  match: FanMatch;
  myFanId: string;
}

export default function FanMatchCard({ match, myFanId }: Props) {
  const otherFanId = match.fan1Id === myFanId ? match.fan2Id : match.fan1Id;
  const fanMatchId = `${match.fan1Id}_${match.fan2Id}`;

  return (
    <div className={`rounded-xl p-3 mb-2 border ${
      match.type === "TWIN"
        ? "bg-purple-950 border-purple-700"
        : "bg-orange-950 border-orange-700"
    }`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{match.type === "TWIN" ? "👥" : "⚔️"}</span>
        <span className={`text-xs font-bold ${match.type === "TWIN" ? "text-purple-300" : "text-orange-300"}`}>
          Fan {match.type}
        </span>
      </div>
      <p className="text-white text-sm font-semibold mb-1">{otherFanId}</p>
      <p className="text-gray-300 text-xs italic mb-2">"{match.reason}"</p>
      <p className="text-gray-500 text-xs mb-2">{match.sharedEvents.length} shared moments</p>
      <Link
        href={`/connect/${fanMatchId}`}
        className={`block text-center text-xs py-1.5 rounded-lg font-medium transition-colors ${
          match.type === "TWIN"
            ? "bg-purple-700 hover:bg-purple-600 text-white"
            : "bg-orange-700 hover:bg-orange-600 text-white"
        }`}
      >
        {match.type === "TWIN" ? "Open Thread" : "Debate"}
      </Link>
    </div>
  );
}
