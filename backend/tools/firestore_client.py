import os
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

_initialized = False
_db = None


def get_db():
    global _initialized, _db
    if not _initialized:
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "./serviceAccountKey.json")
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _db = firestore.client()
        _initialized = True
    return _db


def write_event(event_data: dict):
    db = get_db()
    event_id = event_data["eventId"]
    db.collection("events").document(event_id).set({
        **event_data,
        "reactionCounts": {
            "PUMPED_RCB": 0, "GUTTED_RCB": 0, "FURIOUS_RCB": 0, "PROUD_RCB": 0,
            "PUMPED_DC": 0, "GUTTED_DC": 0, "FURIOUS_DC": 0, "PROUD_DC": 0,
            "WOW_NEUTRAL": 0, "BRILLIANT_NEUTRAL": 0,
        },
        "timestamp": SERVER_TIMESTAMP,
    })
    print(f"[FIRESTORE] Written event {event_id}")


def update_last_event_id(match_id: str, event_id: str):
    db = get_db()
    db.collection("matches").document(match_id).set(
        {"lastEventId": event_id}, merge=True
    )


def get_last_event_id(match_id: str) -> str:
    db = get_db()
    doc = db.collection("matches").document(match_id).get()
    if doc.exists:
        return doc.to_dict().get("lastEventId", "")
    return ""


def write_verdict(event_id: str, question: str):
    db = get_db()
    db.collection("verdicts").document(event_id).set({
        "eventId": event_id,
        "question": question,
        "votes": {
            "YES": {"RCB": 0, "DC": 0, "NEUTRAL": 0},
            "NO": {"RCB": 0, "DC": 0, "NEUTRAL": 0},
            "CLOSE_CALL": {"RCB": 0, "DC": 0, "NEUTRAL": 0},
        },
        "geminiAnalysis": "",
        "closedAt": None,
        "timestamp": SERVER_TIMESTAMP,
    })
    print(f"[FIRESTORE] Written verdict for {event_id}")


def get_all_fans(match_id: str) -> list:
    db = get_db()
    fans = db.collection("fans").where("matchId", "==", match_id).stream()
    return [f.to_dict() for f in fans]


def write_fan_matches(matches: list):
    db = get_db()
    batch = db.batch()
    for match in matches:
        fan1 = match["fan1_id"]
        fan2 = match["fan2_id"]
        doc_id = f"{fan1}_{fan2}"
        ref = db.collection("fan_matches").document(doc_id)
        batch.set(ref, {
            **match,
            "notified": False,
            "createdAt": SERVER_TIMESTAMP,
        })
    batch.commit()
    print(f"[FIRESTORE] Written {len(matches)} fan matches")


def write_forecast_aggregate(over_id: str, aggregates: dict, gemini_take: str):
    db = get_db()
    db.collection("forecasts").document(over_id).set(
        {"aggregates": aggregates, "geminiTake": gemini_take, "updatedAt": SERVER_TIMESTAMP},
        merge=True,
    )


def set_match_live(match_id: str, teams: list, venue: str = ""):
    db = get_db()
    db.collection("matches").document(match_id).set({
        "matchId": match_id,
        "teams": teams,
        "status": "live",
        "currentScore": {},
        "lastEventId": "",
        "venue": venue,
    }, merge=True)
    print(f"[FIRESTORE] Match {match_id} set to live")
