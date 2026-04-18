# FanPulse — IPL Fan Connection Platform
> Built at GDG Cloud New Delhi: Agentic Premier League | April 18, 2026 | RCB vs DC

[![Live Demo](https://img.shields.io/badge/Live%20Demo-fanpulse--frontend-blue)](https://fanpulse-frontend-869301957926.asia-south1.run.app)
[![Backend](https://img.shields.io/badge/Backend-Cloud%20Run-green)](https://fanpulse-backend-869301957926.asia-south1.run.app/health)

---

## What it does

IPL fans watch matches alone. FanPulse makes them find each other — matched by Gemini based on how they emotionally react to the same live moments.

Every wicket, six, and boundary becomes a connection point. Fans who react the same way get paired as **Fan Twins**. Fans on opposite sides of every moment become **Fan Rivals**. All of it happens in real time, anchored to the live match, powered by Gemini.

---

## Demo

**Live app**: https://fanpulse-frontend-869301957926.asia-south1.run.app

### Screens
- **Team Picker** — choose RCB, DC, or Neutral. No account needed.
- **Live Feed** — event cards appear in real time as the match unfolds. React in one tap.
- **Event Thread** — Gemini-generated context + discussion starters + fan comments per event.
- **Fan Verdict** — fans vote together on controversial decisions (LBW, DRS, no-ball).
- **Fan Forecast** — fans predict the final score after each over.
- **Fan Match** — Gemini finds your Fan Twin and Fan Rival and opens a direct thread.

---

## How it works

```
CricAPI (every 30s)
  → Match Watcher (pure Python diff — zero Gemini calls)
  → Python Orchestrator (pure Python routing — zero Gemini calls)
      → Content Agent (LlmAgent — 1 Gemini call per event)
            → fan pulse sentence
            → context summary
            → 3 discussion starters
            → controversy detection
      → Fan Match Agent (LlmAgent — 1 Gemini call per over)
            → reads all fan reaction histories
            → finds Fan Twins (same loyalty, same reactions)
            → finds Fan Rivals (opposite loyalty, mirror reactions)

Firestore (real-time sync)
  → Next.js frontend via onSnapshot()
  → fans react → /reactions
  → fans comment → /threads/{eventId}/messages
  → fans vote → /verdicts/{eventId}
  → fan pairs message → /direct_threads/{fanMatchId}/messages
```

### Architecture diagram

```
┌─────────────────────────────────────────────────────┐
│              FRONTEND (Next.js)                      │
│         Cloud Run | Firebase Firestore               │
│  Live Feed │ Event Thread │ Fan Match Sidebar        │
└────────────────────┬────────────────────────────────┘
                     │ onSnapshot (real-time)
┌────────────────────▼────────────────────────────────┐
│           FIREBASE FIRESTORE                         │
│  /events  /reactions  /fans  /verdicts  /forecasts   │
│  /threads  /fan_matches  /direct_threads             │
└────────────────────┬────────────────────────────────┘
                     │ Firebase Admin SDK
┌────────────────────▼────────────────────────────────┐
│         BACKEND (Python) — Google Cloud Run          │
│                                                      │
│  Match Watcher (pure Python, polls every 30s)        │
│  → Python Orchestrator (pure Python routing)         │
│      → Content Agent (LlmAgent, 1 call/event)        │
│      → Fan Match Agent (LlmAgent, 1 call/over)       │
└──────────┬──────────────────┬────────────────────────┘
           │                  │
    api.cricapi.com    Gemini 2.5 Flash
```

---

## The Agentic Core

This is **not** a chatbot. It is an autonomous multi-agent system that runs for the entire match without human intervention.

### Agent 1: Content Agent (`LlmAgent`)
Fires on every significant event (wicket, six, boundary, fifty, hundred). Makes **one Gemini call** that returns:
- `fan_pulse` — a single charged sentence capturing collective emotion
- `context_summary` — player form, match situation, why this moment matters
- `discussion_starters` — 3 opinionated questions fans can't help but debate
- `is_controversial` — triggers Fan Verdict voting if true
- `significance_score` — events below threshold are skipped to save rate limit budget

### Agent 2: Fan Match Agent (`LlmAgent`)
Fires after every over completes. Makes **one Gemini call** that:
- Reads the full reaction history of all fans accumulated during the match
- Finds **Fan Twins** (same loyalty, reacted identically to 3+ events)
- Finds **Fan Rivals** (opposite loyalty, mirror reactions on 3+ events)
- Reasons over growing state — not stateless

### Python Orchestrator (Pure Python — zero Gemini calls)
Routes each event to the right agents using conditional logic:
```
WICKET / SIX / FOUR / FIFTY / HUNDRED + significance ≥ 4 → Content Agent
significance < 4 → skip, save rate limit budget
is_controversial → create Verdict document after Content Agent
OVER_COMPLETE → Content Agent + Fan Match Agent
```
This is autonomous conditional reasoning, not hardcoded scripting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Model | Gemini 2.5 Flash (Google AI Studio) |
| Agent Framework | Google ADK 1.31.0 |
| Frontend | Next.js 15 + Tailwind CSS |
| Real-time DB | Firebase Firestore |
| Backend Deploy | Google Cloud Run (`--min-instances 1`) |
| Frontend Deploy | Google Cloud Run |
| Cricket Data | api.cricapi.com/v1/ |
| Auth | Firebase Anonymous Auth |

---

## Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- Google Cloud CLI
- Firebase CLI (`npm install -g firebase-tools`)

### 1. Get API Keys
- **Gemini**: aistudio.google.com → Get API Key
- **Cricket**: cricketdata.org → Sign up
- **Firebase**: console.firebase.google.com → new project → Firestore + Anonymous Auth + download `serviceAccountKey.json`

### 2. Backend
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env   # fill in your keys
python3 mock_data.py      # seed 8 demo fans + 3 pre-built events
python3 main.py           # start polling loop
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in Firebase config
npm run dev   # localhost:3000
```

### 4. Deploy Backend
```bash
cd backend
gcloud run deploy fanpulse-backend \
  --source . --region asia-south1 \
  --allow-unauthenticated --memory 512Mi --min-instances 1 \
  --set-env-vars "GEMINI_API_KEY=...,CRICKET_API_KEY=...,MATCH_ID=..."
```

### 5. Deploy Frontend
```bash
cd frontend
gcloud run deploy fanpulse-frontend \
  --source . --region asia-south1 \
  --allow-unauthenticated --memory 512Mi \
  --set-env-vars "NEXT_PUBLIC_FIREBASE_API_KEY=...,..."
```

---

## Fallback Mode

If CricAPI is down during the demo, set `USE_MOCK_EVENTS=true` in `.env`. The backend replays pre-built RCB vs DC events every 60 seconds. The demo still works end-to-end.

---

## Built with

- Gemini 2.5 Flash — Google AI Studio
- Google ADK 1.31.0
- Firebase Firestore + Anonymous Auth
- Google Cloud Run
- Next.js 15 + Tailwind CSS
- api.cricapi.com

---

#GoogleCloud #GoogleCloudAPL #BuildwithAI #GDG #Gemini
