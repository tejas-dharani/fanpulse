"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection, query, orderBy, limit, onSnapshot,
  addDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import type { Loyalty, DirectMessage } from "@/lib/types";

const LOYALTY_COLORS: Record<Loyalty, string> = {
  RCB: "text-red-400", DC: "text-blue-400", NEUTRAL: "text-gray-400",
};

export default function DirectThreadPage() {
  const { fanMatchId } = useParams<{ fanMatchId: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const [fanId, setFanId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loyalty, setLoyalty] = useState<Loyalty>("NEUTRAL");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fid = sessionStorage.getItem("fanId");
    if (!fid) { router.push("/"); return; }
    setFanId(fid);
    setDisplayName(sessionStorage.getItem("displayName") || "Fan");
    setLoyalty((sessionStorage.getItem("loyalty") as Loyalty) || "NEUTRAL");
  }, [router]);

  useEffect(() => {
    if (!fanMatchId) return;
    const q = query(
      collection(db, "direct_threads", fanMatchId, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as any)));
    });
  }, [fanMatchId]);

  async function send() {
    if (!text.trim() || sending || !fanId) return;
    setSending(true);
    try {
      await addDoc(collection(db, "direct_threads", fanMatchId, "messages"), {
        fanMatchId,
        senderId: fanId,
        senderName: displayName,
        senderLoyalty: loyalty,
        text: text.trim(),
        timestamp: serverTimestamp(),
      });
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-xl mx-auto">
      <div className="px-4 py-3 border-b border-gray-800">
        <Link href="/feed" className="text-gray-400 text-sm hover:text-white">← Back</Link>
        <p className="text-white font-semibold mt-1">Fan Connection Thread</p>
        <p className="text-gray-500 text-xs">You've been matched based on shared moments</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">Start talking to your Fan Match.</p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.senderId === fanId;
          return (
            <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs rounded-2xl px-4 py-2 ${isMe ? "bg-yellow-500 text-black" : "bg-gray-800 text-white"}`}>
                {!isMe && (
                  <p className={`text-xs font-bold mb-1 ${LOYALTY_COLORS[msg.senderLoyalty as Loyalty]}`}>
                    {msg.senderName} · {msg.senderLoyalty}
                  </p>
                )}
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-gray-800 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Message your Fan Match..."
          className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-400"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-xl text-sm transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
