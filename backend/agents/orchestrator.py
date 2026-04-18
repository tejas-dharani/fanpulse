import asyncio
import os
from tools.firestore_client import (
    write_event, update_last_event_id, write_verdict, get_all_fans, write_fan_matches
)
from agents.content_agent import run_content_agent
from agents.fan_match_agent import run_fan_match_agent

MIN_SIGNIFICANCE = 4


async def orchestrate(event: dict):
    event_type = event["type"]
    event_id = event["eventId"]
    match_id = event["matchId"]

    print(f"[ORCHESTRATOR] New event: {event_type} — {event.get('player', '')} "
          f"(over {event.get('over')}, score {event.get('scoreAfter')})")

    enriched = dict(event)

    # Always write raw event first so frontend gets something immediately
    write_event(enriched)
    update_last_event_id(match_id, event_id)

    # Skip Content Agent for low-significance or pure over markers
    if event_type == "OVER_COMPLETE":
        print(f"[ORCHESTRATOR] OVER_COMPLETE → enqueueing Content Agent + Fan Match Agent")
        content_result = await run_content_agent(event)
        _apply_content(enriched, content_result)
        write_event(enriched)  # update with enriched content

        fans = get_all_fans(match_id)
        if fans:
            matches = await run_fan_match_agent(fans)
            if matches:
                write_fan_matches(matches)
                print(f"[FAN MATCH] Written {len(matches)} Fan Twin/Rival pairs to Firestore")
        return

    if event_type in ("WICKET", "SIX", "FOUR", "FIFTY", "HUNDRED", "MATCH_START", "MATCH_END"):
        print(f"[ORCHESTRATOR] {event_type} → enqueueing Content Agent")
        content_result = await run_content_agent(event)
        significance = content_result.get("significance_score", 5)

        if significance < MIN_SIGNIFICANCE:
            print(f"[ORCHESTRATOR] significance {significance} < {MIN_SIGNIFICANCE} → skipping enrichment")
            return

        _apply_content(enriched, content_result)

        if content_result.get("is_controversial"):
            print(f"[ORCHESTRATOR] is_controversial: true → creating Verdict document")
            write_verdict(event_id, content_result.get("verdict_question", "Was this decision correct?"))

        write_event(enriched)
        print(f"[ORCHESTRATOR] Written enriched event to Firestore /events/{event_id}")
    else:
        print(f"[ORCHESTRATOR] {event_type} — not significant, skipping Content Agent")


def _apply_content(enriched: dict, content_result: dict):
    enriched["contextSummary"] = content_result.get("context_summary", "")
    enriched["significanceScore"] = content_result.get("significance_score", 5)
    enriched["isControversial"] = content_result.get("is_controversial", False)
    enriched["verdictQuestion"] = content_result.get("verdict_question")
    enriched["fanPulse"] = content_result.get("fan_pulse", "")
    enriched["discussionStarters"] = content_result.get("discussion_starters", [])
    enriched["isVerdictWorthy"] = bool(content_result.get("is_controversial"))
