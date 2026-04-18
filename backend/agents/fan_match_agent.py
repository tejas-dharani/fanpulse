import json
from google.adk.agents import LlmAgent
from google.adk import runners
from google.adk.sessions import InMemorySessionService
from google.genai import types

fan_match_agent = LlmAgent(
    name="fan_match_agent",
    model="gemini-2.5-flash",
    instruction="""
You are given a list of fans with their reaction histories (team loyalty + reaction per event).
Find meaningful pairs:

- Fan Twin: same loyalty, reacted identically (same emotion) to 3+ events
- Fan Rival: opposite loyalty, mirror reactions (one PUMPED when other GUTTED) on 3+ events

For each high-confidence pair (3+ shared reactions), return:
{
  "fan1_id": "...",
  "fan2_id": "...",
  "type": "TWIN" or "RIVAL",
  "reason": "<1 sentence — specific about which moments connected them>",
  "shared_events": ["evt_id_1", "evt_id_2", "evt_id_3"]
}

Return a JSON array. Empty array if no high-confidence matches. No markdown fences.

DEMO NOTE: If fewer than 4 real fans have 3+ reactions, include the seeded demo fans
in your analysis as real participants.
"""
)

_session_service = InMemorySessionService()
_runner = runners.Runner(
    agent=fan_match_agent,
    app_name="fanpulse",
    session_service=_session_service,
)


async def run_fan_match_agent(fans: list) -> list:
    from utils.rate_limiter import rate_limiter
    await rate_limiter.acquire()
    rpm = rate_limiter.current_rpm
    print(f"[FAN MATCH] Gemini call — RPM usage: {rpm}/10 — analysing {len(fans)} fans")
    try:
        session = await _session_service.create_session(app_name="fanpulse", user_id="system")
        result_text = ""
        async for evt in _runner.run_async(
            user_id="system",
            session_id=session.id,
            new_message=types.Content(
                role="user",
                parts=[types.Part(text=json.dumps(fans))]
            ),
        ):
            if evt.is_final_response() and evt.content and evt.content.parts:
                result_text = evt.content.parts[0].text
        matches = json.loads(result_text)
        print(f"[FAN MATCH] Found {len(matches)} matches")
        return matches
    except Exception as e:
        print(f"[FAN MATCH] Error: {e}")
        return []
