import json
from google.adk.agents import LlmAgent
from google.adk import runners
from google.adk.sessions import InMemorySessionService
from google.genai import types

content_agent = LlmAgent(
    name="content_agent",
    model="gemini-2.5-flash",
    instruction="""
You are given a structured cricket event from a live IPL match (RCB vs DC).
In a SINGLE response, return a JSON object with exactly these fields:

{
  "context_summary": "2-3 sentences: player form, match situation, why this moment matters RIGHT NOW.",
  "significance_score": <integer 1-10>,
  "is_controversial": <true if LBW, DRS, no-ball, dropped catch — false otherwise>,
  "verdict_question": "<if is_controversial, the specific yes/no question for fans — else null>",
  "fan_pulse": "One charged sentence capturing the collective emotion.",
  "discussion_starters": [
    "<question 1 — specific to this event, opinionated>",
    "<question 2>",
    "<question 3>"
  ]
}

Be specific. Reference the actual player, over, match situation. Never be generic.
Return only valid JSON. No markdown fences.
"""
)

_session_service = InMemorySessionService()
_runner = runners.Runner(
    agent=content_agent,
    app_name="fanpulse",
    session_service=_session_service,
)


async def run_content_agent(event: dict) -> dict:
    from utils.rate_limiter import rate_limiter
    await rate_limiter.acquire()
    rpm = rate_limiter.current_rpm
    print(f"[CONTENT AGENT] Gemini call — RPM usage: {rpm}/10")
    try:
        session = await _session_service.create_session(app_name="fanpulse", user_id="system")
        result_text = ""
        async for evt in _runner.run_async(
            user_id="system",
            session_id=session.id,
            new_message=types.Content(
                role="user",
                parts=[types.Part(text=json.dumps(event))]
            ),
        ):
            if evt.is_final_response() and evt.content and evt.content.parts:
                result_text = evt.content.parts[0].text
        parsed = json.loads(result_text)
        print(f"[CONTENT AGENT] Generated: fan_pulse='{parsed.get('fan_pulse','')[:60]}' significance={parsed.get('significance_score')}")
        return parsed
    except Exception as e:
        print(f"[CONTENT AGENT] Error: {e}")
        return {
            "context_summary": event.get("rawDescription", ""),
            "significance_score": 5,
            "is_controversial": False,
            "verdict_question": None,
            "fan_pulse": f"{event.get('type')} — {event.get('player', 'a player')} at over {event.get('over')}.",
            "discussion_starters": [
                "What do you think about this moment?",
                "Did this change the game?",
                "Best or worst moment of the match so far?",
            ],
        }
