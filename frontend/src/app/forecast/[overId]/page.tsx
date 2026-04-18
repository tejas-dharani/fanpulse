"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import type { Loyalty } from "@/lib/types";

export default function ForecastPage() {
  const { overId } = useParams<{ overId: string }>();
  const router = useRouter();
  const [fanId, setFanId] = useState("");
  const [loyalty, setLoyalty] = useState<Loyalty>("NEUTRAL");
  const [predictedScore, setPredictedScore] = useState(175);
  const [predictedWinner, setPredictedWinner] = useState<"RCB" | "DC">("RCB");
  const [submitted, setSubmitted] = useState(false);
  const [aggregates, setAggregates] = useState<Record<string, any> | null>(null);
  const [geminiTake, setGeminiTake] = useState("");

  useEffect(() => {
    const fid = sessionStorage.getItem("fanId");
    if (!fid) { router.push("/"); return; }
    setFanId(fid);
    setLoyalty((sessionStorage.getItem("loyalty") as Loyalty) || "NEUTRAL");
  }, [router]);

  useEffect(() => {
    if (!overId) return;
    return onSnapshot(doc(db, "forecasts", overId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setAggregates(d.aggregates);
        setGeminiTake(d.geminiTake || "");
      }
    });
  }, [overId]);

  async function submit() {
    if (!fanId) return;
    await setDoc(doc(db, "forecasts", overId, "submissions", fanId), {
      fanId, loyalty, predictedScore, predictedWinner, timestamp: serverTimestamp(),
    });
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-6 max-w-md mx-auto">
      <Link href="/feed" className="text-gray-400 text-sm hover:text-white mb-4 inline-block">← Back</Link>
      <h1 className="text-white font-bold text-xl mb-6">🔮 Fan Forecast</h1>

      {!submitted ? (
        <div className="space-y-6">
          <div>
            <label className="text-gray-300 text-sm mb-2 block">Predict RCB's final score</label>
            <input
              type="range" min={140} max={220} value={predictedScore}
              onChange={(e) => setPredictedScore(Number(e.target.value))}
              className="w-full accent-yellow-500"
            />
            <p className="text-yellow-400 text-2xl font-bold text-center mt-2">{predictedScore}</p>
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-2 block">Who wins tonight?</label>
            <div className="flex gap-3">
              {(["RCB", "DC"] as const).map((team) => (
                <button
                  key={team}
                  onClick={() => setPredictedWinner(team)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    predictedWinner === team
                      ? team === "RCB" ? "bg-red-700 border-red-400 text-white" : "bg-blue-700 border-blue-400 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={submit}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors"
          >
            Submit Forecast
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-green-400 text-center font-semibold">Forecast submitted! ✅</p>
          {aggregates && (
            <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-gray-400">RCB fans predict: <span className="text-red-400 font-bold">{aggregates.RCB_fans_avg_score}</span></p>
              <p className="text-gray-400">DC fans predict: <span className="text-blue-400 font-bold">{aggregates.DC_fans_avg_score}</span></p>
              <p className="text-gray-400">Overall average: <span className="text-white font-bold">{aggregates.overall_avg_score}</span></p>
            </div>
          )}
          {geminiTake && (
            <p className="text-yellow-300 italic text-sm bg-gray-800 rounded-xl p-3">"{geminiTake}"</p>
          )}
        </div>
      )}
    </div>
  );
}
