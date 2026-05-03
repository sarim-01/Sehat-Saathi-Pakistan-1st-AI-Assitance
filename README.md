# Sehat Saathi

**Pakistan’s 1st AI Decision Support for Lady Health Workers — demo version**

Helps **Pakistan’s Lady Health Workers** think through a case, spot **danger signs**, decide who needs **urgent hospital care**, and know what to tell the **family**. **It is not a doctor** and **does not replace hospital care.** It is an **AI companion** built for the **field**, for the **workers who show up every day.** Narratives may be entered in **English or Urdu**; responses are **AI-generated** and must be used with programme training and clinical judgment.

---

## Overview

| Layer | Role |
|--------|------|
| **Triage** | Always runs first: risk stratification, patient type, referral urgency, and routing. |
| **Specialist** | Runs when triage indicates maternal, paediatric, treatment, nutrition, or adult/chronic depth is needed. |

System prompts are maintained in **Google AI Studio** and exported as `agents/agent1.py` … `agents/agent6.py`. The **orchestrator** extracts embedded `system_instruction` text and calls **Google Gemini** via the **`google-genai`** SDK.

---

## Repository layout

```
├── main.py              # FastAPI app: /chat, /health, CORS
├── orchestrator.py      # Prompt extraction, Gemini calls, triage → route → specialist
├── agents/              # Studio exports (system prompts + reference client code)
│   ├── agent1.py        # Master triage / router
│   ├── agent2.py        # Maternal health
│   ├── agent3.py        # Paediatric & newborn
│   ├── agent4.py        # Treatment protocols
│   ├── agent5.py        # Nutrition
│   └── agent6.py        # Adult & chronic disease
├── requirements.txt
├── Dockerfile
├── .dockerignore
└── frontend/            # Vite + React UI (calls backend /chat)
    └── src/
        ├── App.jsx                  # App shell, hero, theme toggle
        ├── index.css               # Light/dark design tokens & global styles
        ├── theme.js                # Theme persistence helpers
        ├── components/             # ChatWindow, RiskBanner, sections, PDF button, …
        └── utils/                   # clinicalMerge, pdfReport
```

---

## Requirements

- **Python 3.11+** (backend; Docker image uses 3.11)
- **Node.js 18+** (only if you run the `frontend/` app)
- A **Gemini API key** ([Google AI Studio](https://aistudio.google.com/))

---

## Configuration

Create a **`.env`** file in the project root (do **not** commit it):

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Gemini API key from Google AI Studio |
| `GEMINI_MODEL` | No | Override default model (default: `gemini-2.5-flash`) |
| `GEMINI_429_MAX_ATTEMPTS` | No | Retries on HTTP 429 (default: `4`) |

For **Cloud Run** or other hosts, set the same variables in the platform’s secret/environment configuration instead of baking `.env` into images.

---

## Run the API (local)

```bash
cd "path/to/this/repo"
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8080
```

- **OpenAPI docs:** [http://127.0.0.1:8080/docs](http://127.0.0.1:8080/docs)  
- **Health:** `GET /` or `GET /health`  
- **Chat:** `POST /chat` with JSON body `{ "user_input": "..." }`

Example:

```bash
curl -s -X POST http://127.0.0.1:8080/chat \
  -H "Content-Type: application/json" \
  -d "{\"user_input\": \"Pregnant woman 32 weeks, severe headache, blurred vision, swollen hands.\"}"
```

Response shape (simplified): `triage`, `specialist` (or `null`), `agent_used`, `risk`, `patient_type`; on failure, an `error` field and safe fallbacks.

---

## Run the web UI (local)

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown (typically **http://127.0.0.1:5173**). The dev server proxies **`/api/*`** to **`http://127.0.0.1:8080`**, so keep the API running on port **8080**.

For a **production build** with a deployed API, set `VITE_API_BASE` to your API origin (no trailing slash), then `npm run build` and serve `frontend/dist`.

---

## Frontend — UI / UX progress

The **`frontend/`** app is a **mobile-first** (≈390px column, scales to **720px** max width on larger screens), **clinical case-sheet** experience aimed at Lady Health Workers: trustworthy, readable, and field-friendly — not generic “chat cards.”

### Design intent

| Theme | Direction |
|--------|-----------|
| **Product** | One primary flow: describe case → assess → read structured guidance; disclaimers visible. |
| **Visual language** | Women’s-health app quality bar: deep **teal** (trust/clinical), warm **rose** (care), soft **lavender-white** backgrounds (premium, calm). References: Flo, Clue, Maven-style clarity — adapted for Pakistan LHW programme context. |
| **Clinical layout** | **Industrial case document**: ruled sections, typography hierarchy, optional **PDF** aligned to the same fields — not overlapping “card stacks” for the main output. |

### Layout & spacing

| Item | Behaviour |
|------|-----------|
| **Shell width** | `max-width: min(720px, calc(100vw - 32px))` for main column, hero text, nav — **16px minimum** side inset. |
| **Assess Case CTA** | **In-flow** under the textarea inside one **floating card** (ChatGPT/Claude-style), **not** a fixed viewport dock — scrolls with the page. |
| **Sticky chrome** | **Header** fixed (blur + themed `--nav-bg`); content scrolls beneath. |
| **8px rhythm** | Section padding ~**20px**, gaps **16px** / **12px** where specified in components. |

### Header & hero

| Element | Notes |
|---------|------|
| **Nav** | **Sehat Saathi** (brand teal), **Demo** rose pill (white uppercase label), **light/dark toggle** (sun/moon). |
| **Hero** | Theme-aware **`--hero-gradient`** + **`--hero-accent-glow`** (rose lift in light, teal lift in dark), subtle mesh/dot overlays, SVG wave into **`--bg`**. |

### Input (composer card)

| Feature | Notes |
|---------|------|
| **Label** | “Describe the case” with **emerald/teal accent bar** (semantic `--primary`). |
| **Textarea** | Nested surface **`--surface-nested`**, invisible border until **focus** (ring uses **`--focus-ring`**). **500** char cap with counter + mic (**placeholder**: voice coming soon tooltip). |
| **Ghost prompts** | Ethical,typewriter prompts (English + Urdu rotation); clears when user types. |
| **CTA row** | Thin divider above **Assess Case →** gradient button; idle shimmer after inactivity; loading state with pulse + copy. |

### Results (case sheet)

| Block | Role |
|-------|------|
| **`RiskBanner`** | Tier-specific headline (incl. HIGH / monitor / home-care headlines), action lines, optional **HIGH** ⚠️ rail, pills, **HIGH** pulsing left border. Uses **`--risk-*-banner-bg`** and semantic risk text colours. |
| **`ClinicalSections`** | Ruled full-width sections: **Danger signs**, **Referral**, **What to tell the family**, **Follow-up** (with ▪ bullets coloured via **`--bullet-*`** tokens). Referral urgency line accented with **`--highlight`**. |
| **`ClinicalRecordTable`** | “Full clinical record” table strip: label/value rows, zebra **`--surface-nested`**, risk column uses tier colours. |
| **`ResultsSkeleton`** | Shimmer layout mirrors banner + sections + table. |

### Theme system (CSS-only tokens)

All colour decisions live in **`frontend/src/index.css`**:

| Mode | Behaviour |
|------|-----------|
| **Light** | `:root` + **`[data-theme="light"]`** — teal/rose/lavender system (see tokens in file). |
| **Dark** | **`[data-theme="dark"]`** — deep purple surfaces, lighter teal primaries, adjusted risk/bullet colours. |
| **Persistence** | **`localStorage['ss-theme']`** (`light` \| `dark`) after user toggles; if unset, **`prefers-color-scheme`** on first paint (inline **`index.html`** script reduces flash). Listener updates when OS mode changes **only if** user has never saved a manual choice. |

Extra **compatibility aliases** in the same file (e.g. **`--hero-mesh-*`**, **`--shadow-nav`**, **`--muted`**, **`--gold-soft`**) keep legacy or secondary components resolving valid `var()` references without duplicating palette logic.

### Micro-interactions (non-exhaustive)

- **Theme**: ~**300ms** ease on root/body backgrounds and key surfaces where defined.  
- **Buttons**: springy **scale ~0.98** on press; CTA shimmer / idle sweep; download icon **bounce** + **`navigator.vibrate`** when supported.  
- **Motion**: staggered **fade-up** on sections (**~80ms** steps); skeleton **shimmer** sweep.

### PDF case report

**`frontend/src/utils/pdfReport.js`** builds an A4 export (jsPDF): branded header teal **RGB(45,106,143)**, structured rows (patient, risk, pregnancy when present, dangers, referral, family, follow‑up, LHW actions), disclaimer block, footer with IP notice, multi-page **`Page N of M`** when needed.

### Key frontend files (reference)

| Path | Purpose |
|------|---------|
| `frontend/src/App.jsx` | Shell, scroll, hero, nav, footer, results mount, theme toggle wiring. |
| `frontend/src/index.css` | **Design tokens** (light/dark), keyframes, global base. |
| `frontend/src/theme.js` | `getInitialTheme` / `applyTheme` for `data-theme` + storage. |
| `frontend/src/components/ChatWindow.jsx` | Composer, ghost host, assess CTA, API `POST`. |
| `frontend/src/components/RiskBanner.jsx` | Risk strip + pills + HIGH icon. |
| `frontend/src/components/ClinicalSections.jsx` | Four ruled clinical sections + bullets. |
| `frontend/src/components/ClinicalRecordTable.jsx` | Full record table inside sheet. |
| `frontend/src/components/DownloadReportButton.jsx` | PDF trigger. |
| `frontend/src/components/ThemeToggle.jsx` | Accessibility-friendly mode control. |
| `frontend/src/components/AnimatedGhostPrompt.jsx` + `animatedGhostTimelines.js` | Ghost copy rotation. |
| `frontend/src/utils/clinicalMerge.js` | Merge triage/specialist, bullets, referral line heuristics. |

### Typography

**Inter** (weights incl. **800** for hero/risk headlines), **Noto Nastaliq Urdu** for Urdu snippets (via `.urdu`). Loaded from Google Fonts in **`frontend/index.html`**.

---

## Docker

```bash
docker build -t sehat-saathi .
docker run --rm -p 8080:8080 --env-file .env sehat-saathi
```

`Dockerfile` listens on **`${PORT:-8080}`** for **Google Cloud Run**. Pass secrets via the platform, not only `--env-file`, for production.

---

## Specialist routing (from triage JSON)

Triage returns `route_to_specialist`. The orchestrator maps:

| Value | Agent file |
|--------|------------|
| `AGENT_2_MATERNAL` | `agents/agent2.py` |
| `AGENT_3_PEDIATRIC` | `agents/agent3.py` |
| `AGENT_4_TREATMENT` | `agents/agent4.py` |
| `AGENT_5_NUTRITION` | `agents/agent5.py` |
| `AGENT_6_ADULT` | `agents/agent6.py` |
| `NONE` | No second call |

---

## Governance & limitations

- Outputs are **AI-generated** and **non-deterministic**; they require **human review** and alignment with **national LHW programme materials** and **local referral pathways**.  
- The tool **does not** diagnose disease, prescribe medication, or replace **facility-based** care by qualified clinicians.  
---

## Licence

Specify a licence (e.g. MIT, Apache-2.0) when you publish; until then, all rights reserved unless you state otherwise.

---

## Acknowledgements

Built for Pakistan’s **Lady Health Worker** cadre and the communities they serve. Prompt design should remain accountable to **Ministry of National Health Services, Regulations & Coordination** (and provincial) programme guidance and ethics review where applicable.
