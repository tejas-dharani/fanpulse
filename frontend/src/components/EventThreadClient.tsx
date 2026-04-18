"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DiscussionThread from "@/components/DiscussionThread";
import VerdictVote from "@/components/VerdictVote";
import Link from "next/link";
import type { MatchEvent, Loyalty } from "@/lib/types";

export default function EventThreadClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<MatchEvent | null>(null);
  const [fanId, setFanId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loyalty, setLoyalty] = useState<Loyalty>("NEUTRAL");

  useEffect(() => {
    const fid = sessionStorage.getItem("fanId");
    if (!fid) { router.push("/"); return; }
    setFanId(fid);
    setDisplayName(sessionStorage.getItem("displayName") || "Fan");
    setLoyalty((sessionStorage.getItem("loyalty") as Loyalty) || "NEUTRAL");
  }, [router]);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, "events", id), (snap) => {
      if (snap.exists()) setEvent({ ...snap.data(), eventId: snap.id } as MatchEvent);
    });
  }, [id]);

  if (!event) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-4 max-w-xl mx-auto">
      <Link href="/feed" className="text-gray-400 text-sm hover:text-white mb-4 inline-block">← Back to Feed</Link>

      {/* Event header */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-4">
        <p className="text-white font-bold text-lg">{event.player || event.type}</p>
        <p className="text-gray-400 text-sm">{event.scoreAfter} • Over {event.over}</p>
        {event.fanPulse && (
          <p className="text-yellow-300 italic text-sm mt-2">"{event.fanPulse}"</p>
        )}
        {event.contextSummary && (
          <p className="text-gray-300 text-sm mt-2">{event.contextSummary}</p>
        )}
      </div>

      {/* Verdict */}
      {event.isVerdictWorthy && fanId && (
        <VerdictVote eventId={id} fanId={fanId} loyalty={loyalty} />
      )}

      {/* Discussion */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h2 className="text-white font-semibold text-sm mb-3">Discussion</h2>
        {fanId && (
          <DiscussionThread
            eventId={id}
            discussionStarters={event.discussionStarters}
            fanId={fanId}
            displayName={displayName}
            loyalty={loyalty}
          />
        )}
      </div>
    </div>
  );
}
