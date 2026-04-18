"""
Seed Firestore with 8 demo fans + 3 pre-built events.
Run: python mock_data.py
Or triggered by USE_MOCK_EVENTS=true in .env
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

MATCH_ID = os.environ.get("MATCH_ID", "549ba395-31e9-477b-ba2c-a2a0dd1cbec9")

DEMO_FANS = [
    {"fanId": "demo_rcb_1", "displayName": "RCB_Arjun_18", "loyalty": "RCB",
     "reactionHistory": ["evt_wicket_001:GUTTED", "evt_six_002:PUMPED", "evt_wicket_003:GUTTED"],
     "matchedWith": [], "isDemo": True, "matchId": MATCH_ID},
    {"fanId": "demo_rcb_2", "displayName": "RCB_Sneha_7", "loyalty": "RCB",
     "reactionHistory": ["evt_wicket_001:GUTTED", "evt_six_002:PUMPED", "evt_wicket_003:GUTTED"],
     "matchedWith": [], "isDemo": True, "matchId": MATCH_ID},
    {"fanId": "demo_rcb_3", "displayName": "RCB_Dev_99", "loyalty": "RCB",
     "reactionHistory": ["evt_wicket_001:PROUD", "evt_six_002:PUMPED", "evt_wicket_003:FURIOUS"],
     "matchedWith": [], "isDemo": True, "matchId": MATCH_ID},
    {"fanId": "demo_rcb_4", "displayName": "RCB_Meera_12", "loyalty": "RCB",
     "reactionHistory": ["evt_wicket_001:GUTTED", "evt_six_002:PUMPED", "evt_wicket_003:GUTTED"],
     "matchedWith": [], "isDemo": True, "matchId": MATCH_ID},
    {"fanId": "demo_dc_1", "displayName": "DC_Rohan_5", "loyalty": "DC",
     "reactionHistory": ["evt_wicket_001:PUMPED", "evt_six_002:GUTTED", "evt_wicket_003:PUMPED"],
     "matchedWith": [], "isDemo": True, "matchId": MATCH_ID},
    {"fanId": "demo_dc_2", "displayName": "DC_Priya_7", "loyalty": "DC",
     "reactionHistory": ["evt_wicket_001:PUMPED", "evt_six_002:GUTTED", "evt_wicket_003:PUMPED"],
     "matchedWith": [], "isDemo": True, "matchId": MATCH_ID},
    {"fanId": "demo_dc_3", "displayName": "DC_Karan_21", "loyalty": "DC",
     "reactionHistory": ["evt_wicket_001:PUMPED", "evt_six_002:FURIOUS", "evt_wicket_003:PUMPED"],
     "matchedWith": [], "isDemo": True, "matchId": MATCH_ID},
    {"fanId": "demo_neutral_1", "displayName": "Cricket_Lover_42", "loyalty": "NEUTRAL",
     "reactionHistory": ["evt_wicket_001:WOW", "evt_six_002:BRILLIANT", "evt_wicket_003:INTENSE"],
     "matchedWith": [], "isDemo": True, "matchId": MATCH_ID},
]

PRE_BUILT_EVENTS = [
    {
        "eventId": "evt_wicket_001",
        "matchId": MATCH_ID,
        "type": "WICKET",
        "player": "Virat Kohli",
        "team": "RCB",
        "over": "6.4",
        "scoreAfter": "52/1 (6.4)",
        "contextSummary": "Kohli out for 34 off 28 balls. RCB are 52/1 in the powerplay — solid start but losing their anchor now.",
        "significanceScore": 8,
        "isControversial": False,
        "verdictQuestion": None,
        "fanPulse": "Kohli's gone. RCB's innings just hit its first real wobble.",
        "discussionStarters": [
            "Was Kohli right to play that shot in the powerplay?",
            "Can RCB's middle order hold up without Kohli?",
            "Is 52/1 after 6 overs a good or bad position for RCB tonight?",
        ],
        "isVerdictWorthy": False,
        "reactionCounts": {
            "PUMPED_RCB": 0, "GUTTED_RCB": 127, "FURIOUS_RCB": 43, "PROUD_RCB": 89,
            "PUMPED_DC": 203, "GUTTED_DC": 0, "FURIOUS_DC": 0, "PROUD_DC": 0,
            "WOW_NEUTRAL": 34, "BRILLIANT_NEUTRAL": 12,
        },
    },
    {
        "eventId": "evt_six_002",
        "matchId": MATCH_ID,
        "type": "SIX",
        "player": "Glenn Maxwell",
        "team": "RCB",
        "over": "12.1",
        "scoreAfter": "98/2 (12.1)",
        "contextSummary": "Maxwell smashes one over deep midwicket — his 4th six of the innings. RCB are back in control.",
        "significanceScore": 7,
        "isControversial": False,
        "verdictQuestion": None,
        "fanPulse": "Maxwell is absolutely on FIRE. DC's bowlers have no answers tonight.",
        "discussionStarters": [
            "Maxwell or Kohli — who's the bigger match-winner for RCB this season?",
            "Can RCB reach 180+ from here?",
            "Is this the best T20 batting display at Chinnaswamy this season?",
        ],
        "isVerdictWorthy": False,
        "reactionCounts": {
            "PUMPED_RCB": 341, "GUTTED_RCB": 0, "FURIOUS_RCB": 0, "PROUD_RCB": 156,
            "PUMPED_DC": 0, "GUTTED_DC": 189, "FURIOUS_DC": 0, "PROUD_DC": 0,
            "WOW_NEUTRAL": 67, "BRILLIANT_NEUTRAL": 45,
        },
    },
    {
        "eventId": "evt_wicket_003",
        "matchId": MATCH_ID,
        "type": "WICKET",
        "player": "Glenn Maxwell",
        "team": "RCB",
        "over": "15.3",
        "scoreAfter": "132/3 (15.3)",
        "contextSummary": "Maxwell out for 67 off 38 — caught at long-on going for one big shot too many. RCB need 48 off 27.",
        "significanceScore": 9,
        "isControversial": False,
        "verdictQuestion": None,
        "fanPulse": "Maxwell gone. RCB need 48 off 27 — this just became a proper chase.",
        "discussionStarters": [
            "Was Maxwell right to go big with 27 balls still left?",
            "Can RCB's lower order finish this off?",
            "DC's bowling — have they clawed their way back into this match?",
        ],
        "isVerdictWorthy": False,
        "reactionCounts": {
            "PUMPED_RCB": 0, "GUTTED_RCB": 289, "FURIOUS_RCB": 134, "PROUD_RCB": 67,
            "PUMPED_DC": 312, "GUTTED_DC": 0, "FURIOUS_DC": 0, "PROUD_DC": 0,
            "WOW_NEUTRAL": 89, "BRILLIANT_NEUTRAL": 23,
        },
    },
]


def seed():
    cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "./serviceAccountKey.json")
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    db = firestore.client()

    # Seed match
    db.collection("matches").document(MATCH_ID).set({
        "matchId": MATCH_ID,
        "teams": ["RCB", "DC"],
        "status": "live",
        "currentScore": {},
        "lastEventId": "",
        "venue": "M. Chinnaswamy Stadium, Bengaluru",
        "startTime": "2026-04-18T09:30:00Z",
    }, merge=True)
    print(f"[SEED] Match document set: {MATCH_ID}")

    # Seed events
    for event in PRE_BUILT_EVENTS:
        db.collection("events").document(event["eventId"]).set(event)
        print(f"[SEED] Event seeded: {event['eventId']}")

    # Seed fans
    for fan in DEMO_FANS:
        db.collection("fans").document(fan["fanId"]).set({
            **fan,
            "joinedAt": SERVER_TIMESTAMP,
        })
        print(f"[SEED] Fan seeded: {fan['displayName']} ({fan['loyalty']})")

    print(f"\n[SEED] Done. {len(DEMO_FANS)} fans + {len(PRE_BUILT_EVENTS)} events seeded.")
    print(f"[SEED] Fan Match will fire immediately on first OVER_COMPLETE.")


if __name__ == "__main__":
    seed()
