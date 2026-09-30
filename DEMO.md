# SahaMatrix - 3-Minute Live Demo Script

**Tagline:** *"Together, no stock-out."*  
**Audience:** Health Ministers, National Health Mission (NHM) Directors, Evaluators.  
**Total Duration:** 3 Minutes.

---

### Step 1: Map Overview, Personas & Operational Telemetry (30 Seconds)
1. Open the SahaMatrix dashboard at `http://localhost:5173`.
2. Highlight the **Role Switcher** in the header:
   - **State Health Secretary:** Macro statewide visibility, inter-district rebalancing, and counterfactual policy impact.
   - **District CMO:** District-level clusters, emergency outbreak triggers, and local buffer management.
   - **PHC Pharmacist:** Clinic dispensary view, daily paper stock register digitization, and local 14-day forecasts.
3. Highlight the **KPI Row**:
   - **72 PHCs** monitored across 3 critical states: Maharashtra (MH), Uttar Pradesh (UP), and Tamil Nadu (TN).
   - Live supply status with colored CircleMarkers: **Red (Critical <3d)**, **Orange (High <7d)**, and **Green (Healthy)**.
4. Switch the state filter between **All States**, **Maharashtra**, **Uttar Pradesh**, and **Tamil Nadu** to demonstrate dynamic map boundary auto-fitting.

---

### Step 2: Paper Stock Register Digitization (30 Seconds)
1. Click on any PHC on the map (e.g. `Hazratganj Urban PHC` in Lucknow, UP) to open the **PHC View** tab.
2. Click **"Update Stock from Photo"**.
3. Select the provided test register photo at `/sample-register.jpg` (or snap a live photo on mobile).
4. Watch Google Gemini Multimodal Vision extract handwritten/printed register line items, normalize medicine synonyms (e.g. `PCM` to `Paracetamol`, `ACT` to `Artemisinin ACT`), and assign confidence scores.
5. Click **"Confirm Stock Update"** and observe live stock figures immediately update in the inventory table.

---

### Step 3: Trigger Disease Outbreak & Advance Time (25 Seconds)
1. Click the **[Trigger Outbreak]** button in the top navigation bar.
2. Select:
   - **State:** `Uttar Pradesh (UP)`
   - **Surging Medicine:** `Paracetamol`
   - **Demand Multiplier:** `3.0x`
3. Click **"Apply Outbreak"**.
4. Click **[Advance 3 Days]**.
5. Observe the KPIs dynamically react: **Critical alerts spike immediately** as PHC inventories deplete under the outbreak load.

---

### Step 4: Grounded AI Clinical Insight in Hindi (25 Seconds)
1. Switch to the **Alerts** tab. Notice the newly spiked Paracetamol alerts at the top of the ranked list.
2. In the top header, switch the language toggle to **हिंदी (Hindi)**.
3. On the top critical alert, click **"Get AI Insight"**.
4. Review the **AI Clinical Insight card**:
   - Grounded summary in Hindi detailing the ~2-day stock runway.
   - Root cause highlighting the 3x demand surge and 7-day resupply lead time.
   - Recommended action to trigger immediate peer redistribution.
   - Note the **"Powered by Google Gemini"** badge verifying live generation.

---

### Step 5: Voice-First Q&A Assistant (20 Seconds)
1. Switch to the **Ask AI** tab.
2. Click the suggested query chip:
   > *"Which districts in Uttar Pradesh will run out of insulin this week?"*
   *(Or click the microphone icon and speak the question).*
3. Review the precise, grounded answer identifying **Kanpur** as the vulnerable district.
4. Click **"Read Aloud"** to trigger speech synthesis in the selected language.

---

### Step 6: Executive Situation Briefing (15 Seconds)
1. Switch to the **Situation Brief** tab.
2. Review the 5-bullet executive brief synthesized specifically for Uttar Pradesh health leadership.
3. Click **"Copy Brief"** to demonstrate instant briefing exports for WhatsApp or district officer memos.

---

### Step 7: Automated Peer Redistribution & Impact (20 Seconds)
1. Switch to the **Transfers** tab.
2. Hover over a transfer card: observe the interactive dashed polyline appear on the map connecting the surplus PHC to the deficit PHC across district/state lines.
3. Click **[Apply All]**.
4. Notice transfers execute in real time: deficit alerts drop and **"Stock-outs Prevented"** in the top KPI increases.

---

### Step 8: Federated Learning (FedAvg) Performance (15 Seconds)
1. Open the **Federation** tab.
2. Point out the **MAE Bar Chart**:
   - Compare Local-Only MAE vs Federated Global MAE.
   - Highlight **Uttar Pradesh**: despite having the noisiest data and shortest training window, its error drops substantially under federated collaboration.
3. Point out the **Global Loss Convergence Curve** across the 8 FedAvg rounds.
4. Reiterate the privacy guarantee: *Only model weights leave the state; raw patient data stays within state borders.*

---

### Step 9: Pan-India Scaling & In-Memory Benchmark (20 Seconds)
1. Switch to the **Scale** tab.
2. Compare the live demo metrics with the **India-Wide Rollout Estimate** (~30,000 PHCs covering ~900 Million citizens).
3. Click **"Run Benchmark (5,000 PHCs)"**.
4. View the measured execution time: full 14-day forecasts and greedy redistribution computed in **<6 seconds** for 5,000 facilities on this single machine with zero out-of-memory errors.

---

### Resetting for the Next Demo
Click **[Reset Demo]** in the header. The system restores back to baseline seed 42 in under a second, ready for an immediate repeat demonstration.
