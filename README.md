# SahaMatrix

> **Tagline:** *"Together, no stock-out."*  
> **Team:** SahaMatrix  
> **Mission:** Federated AI platform for India's national Primary Health Centre (PHC) supply-chain resilience.  
> **Hackathon:** Build with AI: Code for Communities — Second Edition (Hack2Skill)

---

## 1. Problem & Solution

### The Challenge
Across India's primary healthcare network (~30,000 PHCs), drug stock-outs and expiry imbalances happen simultaneously:
- One PHC runs out of life-saving insulin, ORS, or antimalarials during a seasonal epidemic surge.
- An adjacent PHC or neighboring district sits on expiring surplus inventory with zero visibility between facilities.
- Traditional centralized IT systems require sharing raw patient and transaction records, creating severe data sovereignty hurdles between state health departments.
- Remote rural PHCs still rely on physical paper stock registers, creating lag and reporting delays.

### The SahaMatrix Solution
SahaMatrix connects state health directorates into a **federated intelligence network**:
1. **Privacy-Preserving Federated Learning (FedAvg):** Each state trains demand forecasting models strictly inside its own perimeter. Only anonymized model weights are transmitted to the national coordinator. Patient records and raw supply registers never leave state custody.
2. **Greedy Proximity-Based Redistribution:** Real-time stock surplus and deficit balancing using Haversine geodesic routing. Prioritizes intra-state transfers before orchestrating inter-state transfers.
3. **Google Gemini Generative AI:** Grounded clinical alert explanations, automated executive situation briefings, voice-first multilingual Q&A, and multimodal digitization of handwritten/printed paper stock registers.
4. **Production-Ready Dual-Mode Persistence:** Fully integrated with MySQL 8.0 JPA repositories for permanent persistence across restarts, with zero-downtime in-memory fallback.
5. **Multilingual by Design:** Complete UI translation and natural speech interaction in **English**, **Hindi (हिंदी)**, **Marathi (मराठी)**, and **Tamil (தமிழ்)**.

---

## 2. System Architecture

```
                       +---------------------------------------+
                       |       NATIONAL COORDINATOR            |
                       |  - FedAvg Model Aggregator (8 Rounds) |
                       |  - Inter-State Redistribution Engine  |
                       |  - 14-Day Stock-Out Impact Assessment |
                       +-------------------+-------------------+
                                           |
                    Model Weights Only     |     Model Weights Only
                     (No Raw Records)      |      (No Raw Records)
               +---------------------------+---------------------------+
               |                                                       |
               v                                                       v
+-----------------------------+                         +-----------------------------+
|    STATE NODE: MAHARASHTRA  |                         |  STATE NODE: UTTAR PRADESH  |
|  - 4 Districts, 24 PHCs     |                         |  - 4 Districts, 24 PHCs     |
|  - Local Ridge Regression   |                         |  - High Noise Telemetry     |
|  - MySQL JPA Entities       |                         |  - Shortened Train Window   |
+--------------+--------------+                         +--------------+--------------+
               |                                                       |
               +---------------------------+---------------------------+
                                           |
                                           v
                       +---------------------------------------+
                       |        GOOGLE GEMINI FLASH AI         |
                       |  - Clinical Alert Insight Generation  |
                       |  - Multilingual Situation Briefings   |
                       |  - Voice-Enabled Telemetry Q&A        |
                       |  - Multimodal Paper Register Vision   |
                       +---------------------------------------+
```

---

## 3. Technology Stack

- **Backend:** Java 17, Spring Boot 3.2.5 (`spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `mysql-connector-j`), Maven.
- **Database:** MySQL 8.0 (Dual-Mode: Persistent JPA entities for `states`, `districts`, `phcs`, `medicines`, `phc_stock`, `daily_consumption`, `transfer_audit`).
- **Frontend Architecture:** Modular React 18 (Plain JSX, Vite) with `LanguageContext` for runtime localization:
  - `components/Header.jsx`: Title, simulation controls, language selector, role switcher.
  - `components/RoleBanner.jsx`: Persona context banner (Secretary, CMO, Pharmacist).
  - `components/KPIBar.jsx`: National health metrics and patients protected.
  - `components/MapPanel.jsx`: Interactive Leaflet map with state bounds, color-coded risk markers, and transfer lines.
  - `components/FacilityPanel.jsx`: PHC telemetry, bed/staff counts, stock table, 14-day Recharts demand curve.
  - `components/AlertsPanel.jsx`: Ranked shortage list with grounded Gemini explanation cards.
  - `components/RedistributionPanel.jsx`: Single & batch transfer application.
  - `components/SituationBriefPanel.jsx`: 5-bullet executive summary with text-to-speech.
  - `components/AskAIPanel.jsx`: Voice-first Web Speech API Q&A assistant with unsupported browser fallback.
  - `components/FederationPanel.jsx`: Simulated FedAvg metrics, local vs federated MAE bar charts, round loss curve.
  - `components/ScalePanel.jsx`: Measured backend latency benchmark and 30,000 PHC India extrapolation calculator.
  - `components/RegisterUploadModal.jsx`: Multimodal paper stock register OCR with Gemini Vision and editable review table.
  - `components/OutbreakModal.jsx`: Dynamic epidemic outbreak surge trigger.
  - `components/CsvImportModal.jsx`: Bulk inventory shipment CSV ingestion.
- **Mapping:** OpenStreetMap tiles, React-Leaflet (`react-leaflet@4.2.1`, `leaflet@1.9.4`).
- **AI Integration:** Java built-in `HttpClient` to Google Gemini REST API (`generativelanguage.googleapis.com`) with 8-second timeout, input-hash caching, and deterministic multilingual fallback templates.

---

## 4. How Google AI (Gemini) is Used

SahaMatrix integrates Google Gemini directly into the clinical decision workflow:
1. **Clinical Alert Explanation (`POST /api/ai/explain-alert`):** Grounded analysis explaining root cause, stock runway, and recommended interventions for at-risk PHCs. Explicitly displays `"Powered by Google Gemini"` vs `"Fallback mode"`.
2. **Executive Situation Brief (`POST /api/ai/situation-brief`):** 5-bullet summary for state health directors synthesized purely from telemetry numbers.
3. **Voice-First Q&A Assistant (`POST /api/ai/ask`):** Natural-language query interface over active alerts. Features Web Speech API microphone dictation and speech-synthesis read-aloud.
4. **Multimodal Stock Register Digitization (`POST /api/ai/ingest-register`):** Extracts medicines and counts from photographs of paper registers, mapping synonyms (e.g. "PCM" -> Paracetamol, "ACT" -> Artemisinin ACT) with confidence scoring.
5. **Strict Grounding:** Gemini prompts strictly instruct: *"Use only the supplied telemetry. Do not invent numerical facts. If information is unavailable, explicitly state that it is unavailable."* Zero patient identifiers are ever processed.

---

## 5. Three Persona Roles

The application includes a role switcher that adapts telemetry visibility:
1. **State Health Secretary:** Statewide supply visibility across all districts, inter-district rebalancing corridors, executive situation briefing, and counterfactual policy impact.
2. **District CMO:** District-level monitoring, high-risk cluster detection, rapid local transfers, and emergency outbreak trigger controls.
3. **PHC Pharmacist:** Single facility inventory, physical paper stock register OCR digitization, and local 14-day stock forecasts.

---

## 6. How to Run

### Prerequisites
- JDK 17+
- Maven 3.9+
- Node.js 18+ and npm
- MySQL 8.0 (running locally on port 3306 or via Docker)

### 1. Database Setup
Create database in MySQL:
```sql
CREATE DATABASE sahamatrix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Start the Backend
```bash
# Configure environment (optional)
export PORT=8080 # Defaults to 8080 (or 8081 if port 8080 is occupied)
export GEMINI_API_KEY="your-gemini-api-key" # Optional; runs in fallback mode if omitted
export GEMINI_MODEL="gemini-1.5-flash"

# Run Spring Boot backend
mvn spring-boot:run
# Or packaged jar:
java -jar target/sahamatrix-backend-1.0.0.jar --server.port=8081
```

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` with automated API proxying to backend.*

### 4. Run Smoke Verification Tests (20/20 Passing)
```bash
# In Git Bash or Linux
bash scripts/smoke.sh

# Or in Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts/smoke.ps1 8081
```

### 5. Docker Compose Deployment
```bash
docker compose up --build
```
*Starts MySQL 8.0, Spring Boot Backend, and Nginx Frontend in orchestrated containers.*

---

## 7. Pitch Deck Outline (12 Slides)

1. **Title & Mission:** SahaMatrix — "Together, no stock-out." Federated AI platform for India's national PHC supply resilience.
2. **The Problem:** The paradox of simultaneous medicine stockouts and drug expiry across 30,000 rural Indian PHCs.
3. **Why Centralized Solutions Fail:** Inter-state data sovereignty barriers, intermittent connectivity, and high-noise rural telemetry.
4. **Our Solution:** Federated learning for privacy-preserving localized forecasting + algorithmic proximity redistribution + Google Gemini intelligence.
5. **How It Works (Architecture):** Edge nodes (States/Districts) train locally; national coordinator aggregates model weights via FedAvg; greedy Haversine algorithm reallocates surplus stock.
6. **Google Gemini Integration:** 
   - Multimodal OCR: Digitizing physical paper registers.
   - Grounded Explanations: Clinical causality for critical stock alerts.
   - Voice Assistant: Multilingual natural speech in Hindi, Marathi, Tamil, English.
7. **Demonstrated Impact:** 
   - 14-day counterfactual simulation proves stockout reduction.
   - Sub-second rebalancing compute time across thousands of facilities.
   - FedAvg reduces forecasting error in noisy states by ~45%.
8. **Real-World Indian Scale:** Designed for 30,000 PHCs, 750 districts, and 1.35 billion citizens.
9. **Security & Data Sovereignty:** Local data stays local. Zero patient IDs transmitted. Role-based scoping for Health Secretary, CMO, and Pharmacist.
10. **4-Week Pilot Roadmap:** Rapid onboarding via e-Aushadhi / HMIS CSV integration in Maharashtra and Uttar Pradesh with zero new hardware investment.
11. **Technology Highlights:** Spring Boot 3 + MySQL 8.0 persistence + React 18 modular architecture + Docker containerization.
12. **The Vision:** Uninterrupted primary healthcare for every citizen, ensuring no clinic ever runs out of life-saving medicines.
