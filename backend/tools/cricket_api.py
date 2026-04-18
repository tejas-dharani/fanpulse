import os
import json
import requests
from typing import Optional

CRICKET_API_BASE = "https://api.cricapi.com/v1"

SIGNIFICANT_EVENTS = {"WICKET", "SIX", "FOUR", "FIFTY", "HUNDRED", "OVER_COMPLETE", "MATCH_START", "MATCH_END"}


def get_match_scorecard(match_id: str) -> Optional[dict]:
    key = os.environ["CRICKET_API_KEY"]
    try:
        r = requests.get(
            f"{CRICKET_API_BASE}/match_scorecard",
            params={"apikey": key, "id": match_id, "offset": 0},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        if data.get("status") != "success":
            print(f"[CRICKET API] Non-success status: {data.get('status')}")
            return None
        return data.get("data")
    except Exception as e:
        print(f"[CRICKET API] Error fetching scorecard: {e}")
        return None


def find_rcb_dc_match_id() -> Optional[str]:
    key = os.environ["CRICKET_API_KEY"]
    r = requests.get(
        f"{CRICKET_API_BASE}/currentMatches",
        params={"apikey": key, "offset": 0},
        timeout=10,
    )
    r.raise_for_status()
    matches = r.json().get("data", [])
    for m in matches:
        teams_str = str(m.get("teams", ""))
        if ("Royal Challengers" in teams_str or "RCB" in teams_str) and (
            "Delhi" in teams_str or "DC" in teams_str
        ):
            print(f"[CRICKET API] Found match: {m['id']} — {teams_str}")
            return m["id"]
    return None


def detect_new_event(scorecard: dict, last_event_id: str) -> Optional[dict]:
    """
    Pure Python diff — no Gemini. Returns structured event dict if something
    significant changed since last_event_id, None otherwise.
    """
    if not scorecard:
        return None

    commentary = scorecard.get("commentary", [])
    if not commentary:
        return None

    # commentary is newest-first; iterate to find events after last_event_id
    match_status = scorecard.get("status", "").upper()

    if match_status in ("MATCH NOT STARTED",) and last_event_id == "":
        return _build_event("MATCH_START", scorecard, commentary[0] if commentary else {})

    for entry in commentary:
        event_id = str(entry.get("event_id", entry.get("id", "")))
        if event_id == last_event_id:
            break

        event_type = _classify_entry(entry)
        if event_type in SIGNIFICANT_EVENTS:
            return _build_event(event_type, scorecard, entry)

    # Check for over completion separately
    current_over = _current_over(scorecard)
    if current_over and last_event_id:
        last_over = last_event_id.split("_over_")[1] if "_over_" in last_event_id else None
        if last_over and int(current_over) > int(last_over):
            return _build_over_complete_event(scorecard, current_over)

    if "won" in match_status or "result" in match_status:
        return _build_event("MATCH_END", scorecard, {})

    return None


def _classify_entry(entry: dict) -> str:
    text = (entry.get("commentary", "") + entry.get("title", "")).lower()
    if "wicket" in text or " out " in text or "caught" in text or "bowled" in text or "lbw" in text:
        return "WICKET"
    if "six" in text or "sixer" in text:
        return "SIX"
    if "four" in text or "boundary" in text:
        return "FOUR"
    if "fifty" in text or "50" in text:
        return "FIFTY"
    if "hundred" in text or "century" in text or "100" in text:
        return "HUNDRED"
    return "OTHER"


def _current_over(scorecard: dict) -> Optional[str]:
    try:
        score = scorecard.get("score", [])
        if score:
            overs = score[0].get("inning", {}).get("overs", "0")
            return str(int(float(overs)))
    except Exception:
        pass
    return None


def _build_event(event_type: str, scorecard: dict, entry: dict) -> dict:
    score_info = scorecard.get("score", [{}])[0] if scorecard.get("score") else {}
    inning = score_info.get("inning", {}) if isinstance(score_info, dict) else {}

    batting_team = inning.get("team", scorecard.get("teams", ["RCB"])[0])
    runs = inning.get("r", 0)
    wickets = inning.get("w", 0)
    overs = inning.get("overs", "0")

    player = entry.get("batsman", {}).get("name", "") or entry.get("bowler", {}).get("name", "")
    description = entry.get("commentary", entry.get("title", f"{event_type} event"))

    event_id = f"evt_{event_type.lower()}_{str(entry.get('event_id', entry.get('id', 'x')))}"

    return {
        "eventId": event_id,
        "type": event_type,
        "player": player,
        "team": batting_team,
        "over": str(overs),
        "scoreAfter": f"{runs}/{wickets} ({overs})",
        "rawDescription": description,
        "matchId": scorecard.get("id", os.environ.get("MATCH_ID", "")),
    }


def _build_over_complete_event(scorecard: dict, over: str) -> dict:
    score_info = scorecard.get("score", [{}])[0] if scorecard.get("score") else {}
    inning = score_info.get("inning", {}) if isinstance(score_info, dict) else {}
    batting_team = inning.get("team", "RCB")
    runs = inning.get("r", 0)
    wickets = inning.get("w", 0)

    return {
        "eventId": f"evt_over_{over}_complete",
        "type": "OVER_COMPLETE",
        "player": "",
        "team": batting_team,
        "over": over,
        "scoreAfter": f"{runs}/{wickets} ({over} overs)",
        "rawDescription": f"Over {over} complete",
        "matchId": os.environ.get("MATCH_ID", ""),
    }
