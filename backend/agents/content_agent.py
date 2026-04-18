import json
from google.adk.agents import LlmAgent
from google.adk.tools import agent_tool

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
  "fan_pulse": "One charged sentence capturing the collective emotion. Write it as if you feel it. Example: 'That wicket just silenced 40,000 RCB fans. DC smells blood.'",
  "discussion_starters": [
    "<question 1 — specific to this event, opinionated, fans will argue>",
    "<question 2>",
    "<question 3>"
  ]
}

Be specific. Reference the actual player, over, match situation. Never be generic.
Return only valid JSON. No markdown fences.
"""
)

_content_tool = agent_tool.AgentTool(agent=content_agent)


async def run_content_agent(event: dict) -> dict:
    from utils.rate_limiter import rate_limiter
    await rate_limiter.acquire()
    rpm = rate_limiter.current_rpm
    print(f"[CONTENT AGENT] Gemini call — RPM usage: {rpm}/10")
    try:
        result = await _content_tool.run_async(input=json.dumps(event))
        parsed = json.loads(result)
        print(f"[CONTENT AGENT] Generated: fan_pulse='{parsed.get('fan_pulse', '')[:60]}...' significance={parsed.get('significance_score')}")
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
