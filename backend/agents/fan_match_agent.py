import json
from google.adk.agents import LlmAgent
from google.adk.tools import agent_tool

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

_fan_match_tool = agent_tool.AgentTool(agent=fan_match_agent)


async def run_fan_match_agent(fans: list) -> list:
    from utils.rate_limiter import rate_limiter
    await rate_limiter.acquire()
    rpm = rate_limiter.current_rpm
    print(f"[FAN MATCH] Gemini call — RPM usage: {rpm}/10 — analysing {len(fans)} fans")
    try:
        result = await _fan_match_tool.run_async(input=json.dumps(fans))
        matches = json.loads(result)
        print(f"[FAN MATCH] Found {len(matches)} matches")
        return matches
    except Exception as e:
        print(f"[FAN MATCH] Error: {e}")
        return []
