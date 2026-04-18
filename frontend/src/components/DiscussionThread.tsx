"use client";
import { useState, useEffect } from "react";
import {
  collection, query, orderBy, limit, onSnapshot,
  addDoc, serverTimestamp, doc, updateDoc, increment
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Loyalty } from "@/lib/types";

interface Message {
  id: string;
  fanId: string;
  displayName: string;
  loyalty: Loyalty;
  text: string;
  upvotes: number;
  timestamp?: { seconds: number };
}

interface Props {
  eventId: string;
  discussionStarters?: string[];
  fanId: string;
  displayName: string;
  loyalty: Loyalty;
}

const LOYALTY_COLORS: Record<Loyalty, string> = {
  RCB: "text-red-400",
  DC: "text-blue-400",
  NEUTRAL: "text-gray-400",
};

export default function DiscussionThread({ eventId, discussionStarters, fanId, displayName, loyalty }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "threads", eventId, "messages"),
      orderBy("upvotes", "desc"),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
    });
  }, [eventId]);

  async function send(content: string) {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, "threads", eventId, "messages"), {
        fanId,
        displayName,
        loyalty,
        text: content.trim(),
        upvotes: 0,
        timestamp: serverTimestamp(),
      });
      setText("");
    } finally {
      setSending(false);
    }
  }

  async function upvote(msgId: string) {
    await updateDoc(doc(db, "threads", eventId, "messages", msgId), {
      upvotes: increment(1),
    });
  }

  return (
    <div>
      {/* Discussion starters */}
      {discussionStarters && discussionStarters.length > 0 && (
        <div className="mb-4 space-y-2">
          {discussionStarters.map((q, i) => (
            <button
              key={i}
              onClick={() => setText(q)}
              className="w-full text-left text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 transition-colors"
            >
              💬 {q}
            </button>
          ))}
        </div>
      )}

      {/* Comments */}
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">Be the first to react. Start the debate.</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold ${LOYALTY_COLORS[msg.loyalty]}`}>{msg.displayName}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                msg.loyalty === "RCB" ? "bg-red-900 text-red-300" :
                msg.loyalty === "DC" ? "bg-blue-900 text-blue-300" :
                "bg-gray-700 text-gray-300"
              }`}>{msg.loyalty}</span>
            </div>
            <p className="text-white text-sm">{msg.text}</p>
            <button
              onClick={() => upvote(msg.id)}
              className="mt-2 text-xs text-gray-500 hover:text-yellow-400 transition-colors"
            >
              👍 {msg.upvotes}
            </button>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(text)}
          placeholder="Say something..."
          className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-400"
        />
        <button
          onClick={() => send(text)}
          disabled={sending || !text.trim()}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-black text-sm font-bold rounded-lg transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
