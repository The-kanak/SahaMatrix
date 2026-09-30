# SahaMatrix - Implementation Plan & Verification Checklist

Tagline: "Together, no stock-out."
Scope: India National PHC Network (States: MH, UP, TN)
Google AI: Gemini REST API (Grounded, Safe Fallback, Multimodal, Multilingual)

## Phase 1: India State-Level Domain Models & Read APIs
- [ ] Update models: States (MH, UP, TN), 4 real districts each, 6 PHCs = 72 PHCs
  - MH: Nagpur, Pune, Nashik, Aurangabad
  - UP: Lucknow, Varanasi, Kanpur, Gorakhpur (noisiest data, shortest training window)
  - TN: Chennai, Madurai, Coimbatore, Salem
- [ ] 5 Medicines: Paracetamol, ORS, Amoxicillin, Insulin, Artemisinin ACT
- [ ] Replace all "nation" -> "state", "crossNation" -> "crossState"
- [ ] In-memory DataStore (seeded with 42, deterministic)
- [ ] Endpoints:
  - GET /api/summary (state breakdowns: MH, UP, TN)
  - GET /api/phcs?state=MH|UP|TN
  - GET /api/phcs/{id}
  - GET /api/alerts?state=
  - GET /api/health ({status, phcs, states, geminiConfigured, version})
- [ ] Gate 1: mvn clean package passes; start app; test read & health endpoints; confirm 72 PHCs across 12 Indian districts.

## Phase 2: Core Supply Chain Logic & Simulation
- [ ] ForecastService: 14-day DOW forecast + trend + state outbreak multiplier
- [ ] RedistributionService: Greedy distance transfer (crossState flag, prefers same state)
- [ ] ImpactService: 14-day projected stockouts (baseline vs withSaha) non-mutating
- [ ] Endpoints:
  - GET /api/phcs/{id}/forecast?medicine=...
  - GET /api/recommendations
  - POST /api/recommendations/apply ({ids: [...]})
  - POST /api/simulate/outbreak ({state, medicine, multiplier})
  - POST /api/simulate/advance?days=n
  - POST /api/simulate/reset
  - GET /api/impact
- [ ] Gate 2: Forecast, recommendations, outbreak, advance, reset, impact verified.

## Phase 3: Federated Learning (Simulated In-Process)
- [ ] LocalTrainer per Indian state (MH, UP, TN)
- [ ] UP has noisiest synthetic data and shortest local training window (e.g. 14 days vs 46 days)
- [ ] FedAvg coordinator over 8 rounds
- [ ] Evaluation on held-out 14 days: federatedMae <= localMae for all 3 states (especially UP)
- [ ] Endpoints:
  - GET /api/fl/metrics ({rounds, roundLog, states:[{state, samples, localMae, federatedMae}]})
  - POST /api/fl/train
- [ ] Gate 3: FL metrics return 3 states; federatedMae <= localMae for all three; loss decreases.

## Phase 4: Google AI (Gemini Integration) & Deployability APIs
- [ ] GeminiService (pure java.net.http.HttpClient, 8s timeout, input hash cache, template fallback)
- [ ] Config: env GEMINI_API_KEY, application.properties gemini.model
- [ ] AI Endpoints:
  - POST /api/ai/explain-alert {phcId, medicine, lang} -> {summary, likelyCause, recommendedAction, urgency, source}
  - POST /api/ai/situation-brief {state?, lang} -> {brief: [...], source}
  - POST /api/ai/ask {question, state?, lang} -> {answer, source}
  - POST /api/ai/ingest-register (multipart image max 4MB) -> [{medicine, quantity, confidence}]
  - POST /api/ai/ingest-register/confirm {phcId, rows} -> applies reviewed rows
- [ ] Integration & Scale Endpoints:
  - POST /api/import/stock-csv (multipart CSV: phcId,medicine,quantity) -> {accepted, rejected:[{row,reason}]}
  - GET /api/scale-test?phcs=N (N <= 5000, non-mutating copy, returns {phcs, computeMs})
- [ ] Multi-stage Dockerfiles (Cloud Run backend with $PORT, static frontend with nginx), docker-compose.yml
- [ ] Gate 4: All AI endpoints work with fallback when no key, and real Gemini when key is present; CSV import works; scale-test N=5000 completes without OOM.

## Phase 5: Frontend UI (Vite + React 18, Leaflet, Recharts)
- [ ] India centered map (22.5, 79), zoom 5, CircleMarker color-coded by risk, state bounds fit
- [ ] Header: "SahaMatrix", tagline "Together, no stock-out.", action buttons (Outbreak, Advance 3d, Reset, Import CSV)
- [ ] KPI row: PHCs monitored, Critical alerts, Recommended transfers, Stock-outs prevented
- [ ] Tabs:
  - 1. Alerts (ranked list, "AI Insight" card with language toggle, map focus)
  - 2. Transfers (cards with distance, cross-state badge, hover polyline, Apply / Apply All)
  - 3. PHC Detail (stock table, risk badges, beds/staff bars, forecast chart, "Update Stock from Photo" camera upload & confirm modal)
  - 4. Situation Brief (5-bullet daily brief, state filter, language toggle, Refresh, Copy)
  - 5. Ask SahaMatrix (voice-first with Web Speech API mic & speaker buttons, 3 example chips, grounded chat)
  - 6. Federation (BarChart local vs federated MAE per state, round loss line chart, honesty note, Retrain button)
  - 7. Scale (Live demo counts vs India-wide 30k PHC editable assumptions, people covered/protected, measured computeMs from scale-test)
- [ ] Assets: sample-register.jpg, sample-stock.csv in frontend/public
- [ ] Multilingual support (English, Hindi, Marathi, Tamil)
- [ ] Gate 5: npm run build passes with zero errors; full demo flow works smoothly.

## Phase 6: Polish, Smoke Scripts & Documentation
- [ ] scripts/smoke.sh (curls every endpoint, prints PASS/FAIL)
- [ ] README.md (Problem, Solution, ASCII Architecture, Gemini usage, Pilot plan, Scaling to India, Data sovereignty, Production roadmap, Setup)
- [ ] DEMO.md (3-minute demo script matching the 9 steps)
- [ ] Gate 6: Fresh clone simulation test passes.
