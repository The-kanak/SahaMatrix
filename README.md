# SahaMatrix

> **Tagline:** *"Together, no stock-out."*  
> **Team:** SahaMatrix  
> **Mission:** Federated AI platform for India's national Primary Health Centre (PHC) supply-chain resilience.

---

## 1. Problem & Solution

### The Challenge
Across India's primary healthcare network, drug stock-outs and expiry imbalances happen simultaneously: one PHC runs out of life-saving insulin or paracetamol during a seasonal surge, while another PHC in an adjacent district or neighboring state sits on expiring surplus inventory. 

Traditional centralized systems require sharing raw patient and transaction records, creating severe data sovereignty hurdles between state health departments. Furthermore, data-poor or high-noise regions struggle to build accurate predictive forecasting models in isolation.

### The SahaMatrix Solution
SahaMatrix connects state health directorates into a **federated intelligence network**:
1. **Privacy-Preserving Federated Learning (FedAvg):** Each state trains demand forecasting models strictly inside its own perimeter. Only anonymized model weights are transmitted to the national coordinator. Patient records and raw supply registers never leave state custody.
2. **Greedy Proximity-Based Redistribution:** Real-time stock surplus and deficit balancing using Haversine geodesic routing. Prioritizes intra-state transfers before orchestrating inter-state transfers.
3. **Google Gemini Generative AI:** Grounded clinical alert explanations, automated executive situation briefings, voice-first multilingual Q&A, and multimodal digitization of handwritten/printed paper stock registers.

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
|  - In-Memory Telemetry      |                         |  - Shortened Train Window   |
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

- **Backend:** Java 17, Spring Boot 3.2.5 (`spring-boot-starter-web`), Maven.
- **In-Memory Telemetry:** ConcurrentHashMap / ArrayList singleton data store seeded deterministically with seed `42`.
- **Frontend:** Vite, React 18 (Plain JSX, no TypeScript), `react-leaflet@4.2.1`, `leaflet@1.9.4`, `recharts@2.12.7`, `lucide-react`.
- **Mapping:** OpenStreetMap tiles, React-Leaflet `<CircleMarker>` elements.
- **AI Integration:** Java built-in `HttpClient` to Google Gemini REST API (`generativelanguage.googleapis.com`) with 8-second timeout, input-hash caching, and deterministic multilingual fallback templates.

---

## 4. How Google AI (Gemini) is Used

SahaMatrix integrates Google Gemini directly into the supply chain workflow:
1. **Clinical Alert Explanation (`POST /api/ai/explain-alert`):** Grounded analysis explaining root cause, stock runway, and recommended interventions for at-risk PHCs.
2. **Executive Situation Brief (`POST /api/ai/situation-brief`):** 5-bullet summary for state health directors synthesized purely from telemetry numbers.
3. **Voice-First Q&A Assistant (`POST /api/ai/ask`):** Natural-language query interface over active alerts. Features Web Speech API microphone dictation and speech-synthesis read-aloud.
4. **Multimodal Stock Register Digitization (`POST /api/ai/ingest-register`):** Extracts medicines and counts from photographs of paper registers, mapping synonyms (e.g. "PCM" -> Paracetamol, "ACT" -> Artemisinin ACT) with confidence scoring.
5. **Privacy-by-Design:** Only aggregated operational metrics are sent to Gemini. Zero patient identifiers are ever processed. If no API key is provided, the platform seamlessly runs in high-fidelity deterministic fallback mode.

---

## 5. Pilot Plan (4 Weeks)

- **Weeks 1–2:** Deploy single state node (e.g., Maharashtra) across 4 districts via CSV upload and HMIS/e-Aushadhi connectors. Validate multimodal register capture in remote rural PHCs.
- **Weeks 3–4:** Onboard second state node (e.g., Uttar Pradesh). Enable in-process federated model aggregation. Quantify generalization error improvements for high-noise districts.
- **Infrastructure Footprint:** Zero new hardware required. Runs on existing district health office laptops with intermittent offline tolerance.

---

## 6. Scaling to India & Data Sovereignty

- **India-Wide Horizon:** Scaling from 72 demo PHCs to ~30,000 PHCs across 36 States/UTs protecting a population of ~900 Million people.
- **Data Sovereignty:** State health departments maintain complete ownership of operational databases. National coordinator only exchanges ephemeral gradient vectors.
- **Production Roadmap (Planned):**
  - **Vertex AI:** National forecast orchestration and model serving.
  - **BigQuery:** Analytics and national stock-out trend telemetry.
  - **Cloud Run:** Containerized regional state node deployment.
  - **ABDM Integration:** Connection with Ayushman Bharat Digital Mission health IDs and registries.
  - **Calibration Sources:** Calibrated against public epidemiological and climate patterns from data.gov.in, WHO, and IMD. *(Demo data is synthetic and seeded with 42).*

---

## 7. How to Run

### Prerequisites
- JDK 17+
- Maven 3.9+
- Node.js 18+ and npm

### 1. Start the Backend
```bash
# Set environment variables (optional)
export PORT=8080
export GEMINI_API_KEY="your-api-key-here" # Optional, runs in fallback mode if omitted

# Run Spring Boot backend
mvn spring-boot:run
# Alternatively:
# mvn clean package && java -jar target/sahamatrix-backend-1.0.0.jar
```
*Backend runs on `http://localhost:8080` (or `8081` if PORT is overridden).*

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` with automated API proxying to backend.*

### 3. Run Smoke Verification Tests
```bash
# In Git Bash or Linux
bash scripts/smoke.sh

# Or in Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts/smoke.ps1
```

### 4. Docker Deployment
```bash
docker-compose up --build
```
