# AI Product Teardown 🔬

> Drop a URL. Get a brutal, board-room-grade PM teardown in ~15 seconds.

**[Live Demo](https://ai-product-teardown.vercel.app)** · **[Backend API](https://ai-product-teardown.onrender.com/docs)**

---

![AI Product Teardown](https://img.shields.io/badge/LLaMA_3.3-70B-orange?style=flat-square&logo=meta)
![Groq](https://img.shields.io/badge/Groq-Inference-orange?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## What is this?

AI Product Teardown is a PM-grade product analysis engine. Paste any product URL or describe a product in plain English — the system scrapes the page, feeds it to **LLaMA 3.3 70B** running on Groq, and returns a structured teardown that reads like it was written by a senior PM at a16z.

Not a summary. Not a description. A **diagnosis**.

---

## The Teardown Output

Every analysis returns 12 structured sections:

| Section | What you get |
|---|---|
| **Target Users** | Primary persona, secondary, and who the product explicitly fails |
| **Pain Points** | Up to 4 pain points with severity (Critical / High / Medium / Low) and structural insight |
| **Value Proposition** | Core promise, differentiation, and the exact aha moment |
| **Monetization** | Current model, pricing psychology, revenue levers, and gaps being left on the table |
| **Growth Mechanics** | Acquisition → Activation → Retention → Referral → Expansion |
| **Competitive Landscape** | 3 direct competitors, 3 indirect alternatives, moat, and clearest attack vector |
| **What Works** | 3 things the product does genuinely well + the strategic reason why |
| **What's Missing** | 4 gaps with user impact, opportunity size, and Build / Partner / Acquire recommendation |
| **Red Flags** | 3 strategic / product / business risks with actionable recommendations |
| **PM Verdict** | Score /10, rationale, biggest 6-month bet, and Kill / Pivot / Hold / Scale call |

---

## Demo

```
Input:  https://notion.so
Output: Full PM teardown — 8/10 · SCALE
        Analyzed in 9.2s via Jina · 12,001 chars
```

---

## Tech Stack

### Backend
| Tool | Role |
|---|---|
| **FastAPI** | REST API, request routing, rate limiting |
| **Groq** | LLM inference — LLaMA 3.3 70B Versatile |
| **Jina Reader** | Free URL scraping → clean markdown (no API key needed) |
| **httpx** | Async HTTP — Jina primary, direct fetch fallback |
| **python-dotenv** | Environment config |
| **uvicorn** | ASGI server |

### Frontend
| Tool | Role |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool |
| **Syne** | Display font — geometric, authoritative |
| **IBM Plex Mono** | Data/scores font — technical precision |
| **Instrument Sans** | Body font — editorial, not Inter |

### Infrastructure
| Service | Role |
|---|---|
| **Render** | Backend hosting (Free tier) |
| **Vercel** | Frontend hosting (Hobby tier) |

**Zero cost stack. Fully production deployed.**

---

## Architecture

```
User Input (URL or Description)
        │
        ▼
┌─────────────────┐
│   React / Vite  │  InputPanel → fetch POST /analyze
│   (Vercel)      │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────────────┐
│           FastAPI Backend               │
│           (Render)                      │
│                                         │
│  ┌─────────────┐   ┌─────────────────┐ │
│  │  Rate       │   │  URL Validator  │ │
│  │  Limiter    │   │                 │ │
│  │  (per IP)   │   └────────┬────────┘ │
│  └─────────────┘            │          │
│                             ▼          │
│                    ┌─────────────────┐ │
│                    │  scraper.py     │ │
│                    │                 │ │
│                    │  Jina Reader ──►│ │
│                    │  Direct Fetch   │ │
│                    │  (fallback)     │ │
│                    └────────┬────────┘ │
│                             │          │
│                             ▼          │
│                    ┌─────────────────┐ │
│                    │  analyzer.py    │ │
│                    │                 │ │
│                    │  prompts.py ───►│ │
│                    │  Groq API      │ │
│                    │  LLaMA 3.3 70B │ │
│                    │                 │ │
│                    │  JSON extract   │ │
│                    │  Validate       │ │
│                    │  Sanitize       │ │
│                    └────────┬────────┘ │
└─────────────────────────────┼──────────┘
                              │
                              ▼
                    Structured Teardown JSON
                              │
                              ▼
                    ┌─────────────────┐
                    │  TeardownCard   │
                    │  9 Sections     │
                    │  Score Ring     │
                    │  Verdict Chip   │
                    └─────────────────┘
```

---

## Project Structure

```
ai-product-teardown/
├── backend/
│   ├── main.py          # FastAPI app — routes, middleware, rate limiting
│   ├── analyzer.py      # Groq API call, retry logic, JSON extraction
│   ├── scraper.py       # Jina + direct HTTP scraping with fallback
│   ├── prompts.py       # PM teardown system prompt (the secret sauce)
│   ├── requirements.txt
│   └── .env             # not committed
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputPanel.jsx    # URL/description input, examples, submit
│   │   │   ├── TeardownCard.jsx  # Full teardown display + score ring
│   │   │   ├── Section.jsx       # 9 section renderers
│   │   │   └── Loader.jsx        # Analysis loading overlay
│   │   ├── App.jsx               # App shell, nav, routing
│   │   ├── main.jsx              # Entry point
│   │   └── index.css             # Full design system
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env                      # not committed
│
└── README.md
```

---

## Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

### Backend

```bash
cd backend

# Create .env
cp .env.example .env
# Add your GROQ_API_KEY to .env

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

# Create .env
echo "VITE_API_URL=http://localhost:8000" > .env

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Environment Variables

### `backend/.env`
```
GROQ_API_KEY=gsk_...
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
REQUEST_LIMIT=10
WINDOW_SECONDS=60
ENV=development
```

### `frontend/.env`
```
VITE_API_URL=http://localhost:8000
```

---

## API Reference

### `POST /analyze`

**Request:**
```json
{
  "input_type": "url",
  "url": "https://notion.so"
}
```

```json
{
  "input_type": "description",
  "description": "A Slack bot that summarizes missed threads..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product_name": "Notion",
    "one_liner": "...",
    "target_users": { ... },
    "pain_points_solved": [ ... ],
    "value_proposition": { ... },
    "monetization": { ... },
    "growth_mechanics": { ... },
    "competitive_landscape": { ... },
    "what_works": [ ... ],
    "what_is_missing": [ ... ],
    "red_flags": [ ... ],
    "pm_verdict": {
      "overall_score": 8,
      "kill_or_scale": "Scale",
      ...
    }
  },
  "model": "llama-3.3-70b-versatile",
  "processing_time_ms": 9200,
  "scrape_method": "jina",
  "char_count": 12001,
  "partial": false,
  "request_id": "a3f92b1c"
}
```

### `GET /health`
```json
{
  "status": "healthy",
  "groq_key_loaded": true,
  "rate_limit": "10 requests per 60s per IP",
  "active_ips_tracked": 3
}
```

---

## Key Engineering Decisions

**Why Jina Reader for scraping?**
Free, no API key, returns clean markdown from any URL. Falls back to direct HTTP + HTML stripping when Jina fails or returns thin content. A content quality gate (`is_content_useful()`) prevents sending garbage to the LLM.

**Why Groq over OpenAI?**
Inference speed. LLaMA 3.3 70B on Groq returns a full teardown in 8-12 seconds. GPT-4o on OpenAI takes 20-35 seconds for equivalent output. For a tool where waiting is the main UX pain point, this matters.

**Why not stream the response?**
The output is structured JSON — streaming partial JSON to the frontend and rendering it progressively would require a JSON streaming parser and significantly more complex UI state management. The loader UX (step cycling, progress bar, dot grid) is a better tradeoff for a portfolio project.

**Why in-memory rate limiting?**
No Redis dependency needed. A sliding window per-IP store with an async cleanup task handles the load for a free-tier deployment. The `asyncio.Lock()` makes it race-condition-safe under concurrent requests.

**Why inject styles via `useInjectStyles`?**
The app renders 9 `<Section>` components simultaneously. Without deduplication, that's 9 identical `<style>` blocks injected into the DOM. The `stylesInjected` flag ensures each component's CSS fires exactly once per app lifetime.

---

## The Prompt Engineering

The system prompt (`backend/prompts.py`) is the core of this project. Key decisions:

- **Persona framing** — "15+ years across YC, FAANG, VC-funded scaleups" sets the analytical register
- **Exact count constraints** — "Return exactly 4 items" prevents lazy short responses
- **Enum enforcement** — `"Kill | Pivot | Hold | Scale"` keeps output machine-parseable
- **Input routing** — URL scrapes get "treat as ground truth", descriptions get "infer aggressively + flag assumptions with [Assumed]"
- **Anti-vagueness instruction** — "Vague answers like 'improve UX' are unacceptable. Name real competitors."

---

## What's Next

- [ ] Export teardown as PDF
- [ ] Side-by-side comparison of two products
- [ ] Teardown history (local storage)
- [ ] Share a teardown via URL
- [ ] Custom teardown focus (e.g. "focus on monetization gaps")
- [ ] Competitor teardown batch mode

---

## Built By

**Swapnil Hazra** — AI Engineer, Vibe Coder

Part of my **100 Days of Vibe Coding** challenge — shipping one real, deployed project every day.

- 🐦 X: [@SwapnilHazra4](https://x.com/SwapnilHazra4)
- 💼 GitHub: [@Swapnil-bo](https://github.com/Swapnil-bo)
- 🌐 Portfolio: [swapnilhazra.vercel.app](https://swapnilhazra.vercel.app)

---

*Built end to end in one session. Zero to deployed.*