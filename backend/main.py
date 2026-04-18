import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from tools.cricket_api import get_match_scorecard, detect_new_event
from tools.firestore_client import get_last_event_id, set_match_live
from agents.orchestrator import orchestrate

POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL_SECONDS", "30"))
USE_MOCK = os.environ.get("USE_MOCK_EVENTS", "false").lower() == "true"
MATCH_ID = os.environ.get("MATCH_ID", "")

app = FastAPI(title="FanPulse Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "match_id": MATCH_ID, "mock_mode": USE_MOCK}


@app.get("/match/{match_id}/last-event")
def last_event(match_id: str):
    return {"lastEventId": get_last_event_id(match_id)}


async def polling_loop():
    if not MATCH_ID:
        print("[MAIN] ERROR: MATCH_ID not set. Run the match ID finder script and add it to .env")
        return

    print(f"[MAIN] Starting polling loop — match {MATCH_ID}, interval {POLL_INTERVAL}s")
    set_match_live(MATCH_ID, ["RCB", "DC"], "M. Chinnaswamy Stadium, Bengaluru")

    if USE_MOCK:
        await _mock_polling_loop()
        return

    while True:
        try:
            last_event_id = get_last_event_id(MATCH_ID)
            scorecard = get_match_scorecard(MATCH_ID)

            if scorecard:
                event = detect_new_event(scorecard, last_event_id)
                if event:
                    print(f"[MAIN] New event detected: {event['type']} — {event.get('player', '')}")
                    await orchestrate(event)
                else:
                    print(f"[MAIN] No new significant event (last: {last_event_id})")
            else:
                print("[MAIN] No scorecard returned from Cricket API")

        except Exception as e:
            print(f"[MAIN] Polling error: {e}")

        await asyncio.sleep(POLL_INTERVAL)


async def _mock_polling_loop():
    from mock_data import PRE_BUILT_EVENTS
    print("[MAIN] MOCK MODE — replaying pre-built events every 60s")
    import time

    idx = 0
    while True:
        if idx < len(PRE_BUILT_EVENTS):
            event = PRE_BUILT_EVENTS[idx]
            print(f"[MAIN] MOCK event: {event['type']} — {event.get('player', '')}")
            try:
                await orchestrate(event)
            except Exception as e:
                print(f"[MAIN] Mock orchestrate error: {e}")
            idx += 1
        else:
            print("[MAIN] MOCK — all events replayed, looping")
            idx = 0
        await asyncio.sleep(60)


@app.on_event("startup")
async def startup():
    asyncio.create_task(polling_loop())


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=False)
