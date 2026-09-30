package com.sahamatrix.controller;

import com.sahamatrix.dto.*;
import com.sahamatrix.exception.ResourceNotFoundException;
import com.sahamatrix.model.DailyConsumption;
import com.sahamatrix.model.MedicineStock;
import com.sahamatrix.model.PHC;
import com.sahamatrix.model.RiskLevel;
import com.sahamatrix.service.*;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final DataStore dataStore;
    private final ForecastService forecastService;
    private final RedistributionService redistributionService;
    private final ImpactService impactService;
    private final FederatedLearningService federatedLearningService;
    private final GeminiService geminiService;

    public ApiController(DataStore dataStore,
                         ForecastService forecastService,
                         RedistributionService redistributionService,
                         ImpactService impactService,
                         FederatedLearningService federatedLearningService,
                         GeminiService geminiService) {
        this.dataStore = dataStore;
        this.forecastService = forecastService;
        this.redistributionService = redistributionService;
        this.impactService = impactService;
        this.federatedLearningService = federatedLearningService;
        this.geminiService = geminiService;
    }

    @GetMapping("/summary")
    public SummaryResponse getSummary() {
        LocalDate simDate = dataStore.getSimDate();
        List<PHC> phcs = dataStore.getAllPHCs();

        int criticalAlerts = 0;
        int highAlerts = 0;

        Map<String, Integer> stateCritical = new LinkedHashMap<>();
        Map<String, Integer> stateHigh = new LinkedHashMap<>();
        Map<String, Integer> statePhcs = new LinkedHashMap<>();

        for (String s : DataStore.STATES) {
            stateCritical.put(s, 0);
            stateHigh.put(s, 0);
            statePhcs.put(s, 0);
        }

        for (PHC phc : phcs) {
            String state = phc.getState();
            statePhcs.put(state, statePhcs.getOrDefault(state, 0) + 1);

            for (String medicine : DataStore.MEDICINES) {
                MedicineStock stock = phc.getMedicineStock(medicine);
                if (stock == null) continue;

                double outbreakMult = dataStore.getOutbreakMultiplier(state, medicine);
                List<DailyConsumption> forecast = forecastService.generate14DayForecast(phc, medicine, outbreakMult, simDate);
                double avgDemand = forecastService.calculateAvgDailyDemand(forecast);
                double daysOfStock = forecastService.calculateDaysOfStock(stock.getQuantity(), avgDemand);
                RiskLevel risk = forecastService.calculateRiskLevel(daysOfStock);

                if (risk == RiskLevel.CRITICAL) {
                    criticalAlerts++;
                    stateCritical.put(state, stateCritical.getOrDefault(state, 0) + 1);
                } else if (risk == RiskLevel.HIGH) {
                    highAlerts++;
                    stateHigh.put(state, stateHigh.getOrDefault(state, 0) + 1);
                }
            }
        }

        List<RecommendationDto> recs = redistributionService.generateRecommendations(phcs, dataStore, simDate);

        List<SummaryResponse.StateSummaryDto> stateList = new ArrayList<>();
        for (String s : DataStore.STATES) {
            stateList.add(new SummaryResponse.StateSummaryDto(
                    s,
                    DataStore.STATE_NAMES.getOrDefault(s, s),
                    statePhcs.getOrDefault(s, 0),
                    stateCritical.getOrDefault(s, 0),
                    stateHigh.getOrDefault(s, 0)
            ));
        }

        SummaryResponse.TotalsDto totals = new SummaryResponse.TotalsDto(
                phcs.size(),
                criticalAlerts,
                highAlerts,
                recs.size()
        );

        return new SummaryResponse(simDate.toString(), totals, stateList);
    }

    @GetMapping("/phcs")
    public List<PHCSummaryDto> getPHCs(@RequestParam(required = false) String state) {
        LocalDate simDate = dataStore.getSimDate();
        List<PHC> phcs = dataStore.getAllPHCs();
        List<PHCSummaryDto> result = new ArrayList<>();

        for (PHC phc : phcs) {
            if (state != null && !state.isBlank() && !phc.getState().equalsIgnoreCase(state.trim())) {
                continue;
            }

            RiskLevel worst = RiskLevel.OK;
            double minDays = Double.MAX_VALUE;

            for (String med : DataStore.MEDICINES) {
                MedicineStock stock = phc.getMedicineStock(med);
                if (stock == null) continue;

                double outbreakMult = dataStore.getOutbreakMultiplier(phc.getState(), med);
                List<DailyConsumption> forecast = forecastService.generate14DayForecast(phc, med, outbreakMult, simDate);
                double avgDemand = forecastService.calculateAvgDailyDemand(forecast);
                double daysOfStock = forecastService.calculateDaysOfStock(stock.getQuantity(), avgDemand);
                RiskLevel risk = forecastService.calculateRiskLevel(daysOfStock);

                worst = forecastService.worstRisk(worst, risk);
                if (daysOfStock < minDays) {
                    minDays = daysOfStock;
                }
            }

            if (minDays == Double.MAX_VALUE) {
                minDays = 0.0;
            }

            result.add(new PHCSummaryDto(
                    phc.getId(),
                    phc.getName(),
                    phc.getState(),
                    phc.getDistrict(),
                    phc.getLat(),
                    phc.getLng(),
                    worst,
                    minDays,
                    phc.getBedsTotal(),
                    phc.getBedsOccupied(),
                    phc.getStaffPresent(),
                    phc.getStaffTotal()
            ));
        }

        return result;
    }

    @GetMapping("/phcs/{id}")
    public PHCDetailDto getPHCDetail(@PathVariable String id) {
        PHC phc = dataStore.getPHCById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PHC not found with id: " + id));

        LocalDate simDate = dataStore.getSimDate();
        List<StockDetailDto> stockDetails = new ArrayList<>();
        RiskLevel worst = RiskLevel.OK;
        double minDays = Double.MAX_VALUE;

        for (String med : DataStore.MEDICINES) {
            MedicineStock stock = phc.getMedicineStock(med);
            if (stock == null) continue;

            double outbreakMult = dataStore.getOutbreakMultiplier(phc.getState(), med);
            List<DailyConsumption> forecast = forecastService.generate14DayForecast(phc, med, outbreakMult, simDate);
            double avgDemand = forecastService.calculateAvgDailyDemand(forecast);
            double daysOfStock = forecastService.calculateDaysOfStock(stock.getQuantity(), avgDemand);
            RiskLevel risk = forecastService.calculateRiskLevel(daysOfStock);

            worst = forecastService.worstRisk(worst, risk);
            if (daysOfStock < minDays) {
                minDays = daysOfStock;
            }

            stockDetails.add(new StockDetailDto(
                    med,
                    stock.getQuantity(),
                    avgDemand,
                    daysOfStock,
                    risk
            ));
        }

        if (minDays == Double.MAX_VALUE) {
            minDays = 0.0;
        }

        return new PHCDetailDto(
                phc.getId(),
                phc.getName(),
                phc.getState(),
                phc.getDistrict(),
                phc.getLat(),
                phc.getLng(),
                worst,
                minDays,
                phc.getBedsTotal(),
                phc.getBedsOccupied(),
                phc.getStaffPresent(),
                phc.getStaffTotal(),
                stockDetails
        );
    }

    @GetMapping("/phcs/{id}/forecast")
    public ForecastResponse getForecast(@PathVariable String id, @RequestParam(defaultValue = "Insulin") String medicine) {
        PHC phc = dataStore.getPHCById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PHC not found with id: " + id));

        MedicineStock stock = phc.getMedicineStock(medicine);
        if (stock == null) {
            return new ForecastResponse(List.of(), List.of());
        }

        List<DailyConsumption> allHistory = stock.getHistory();
        int historySize = allHistory.size();
        List<DailyConsumption> last30History = (historySize > 30)
                ? allHistory.subList(historySize - 30, historySize)
                : allHistory;

        double outbreakMult = dataStore.getOutbreakMultiplier(phc.getState(), medicine);
        List<DailyConsumption> forecast = forecastService.generate14DayForecast(phc, medicine, outbreakMult, dataStore.getSimDate());

        return new ForecastResponse(last30History, forecast);
    }

    @GetMapping("/alerts")
    public List<AlertDto> getAlerts(@RequestParam(required = false) String state) {
        LocalDate simDate = dataStore.getSimDate();
        List<PHC> phcs = dataStore.getAllPHCs();
        List<AlertDto> alerts = new ArrayList<>();

        for (PHC phc : phcs) {
            if (state != null && !state.isBlank() && !phc.getState().equalsIgnoreCase(state.trim())) {
                continue;
            }

            for (String med : DataStore.MEDICINES) {
                MedicineStock stock = phc.getMedicineStock(med);
                if (stock == null) continue;

                double outbreakMult = dataStore.getOutbreakMultiplier(phc.getState(), med);
                List<DailyConsumption> forecast = forecastService.generate14DayForecast(phc, med, outbreakMult, simDate);
                double avgDemand = forecastService.calculateAvgDailyDemand(forecast);
                double daysOfStock = forecastService.calculateDaysOfStock(stock.getQuantity(), avgDemand);
                RiskLevel risk = forecastService.calculateRiskLevel(daysOfStock);

                if (risk == RiskLevel.CRITICAL || risk == RiskLevel.HIGH) {
                    String msg = String.format(Locale.US, "%s at %s will run out in ~%.1f days; resupply takes 7",
                            med, phc.getName(), daysOfStock);

                    alerts.add(new AlertDto(
                            phc.getId(),
                            phc.getName(),
                            phc.getState(),
                            phc.getDistrict(),
                            med,
                            daysOfStock,
                            risk,
                            msg
                    ));
                }
            }
        }

        alerts.sort(Comparator.comparingDouble(AlertDto::daysOfStock));
        return alerts;
    }

    @GetMapping("/recommendations")
    public List<RecommendationDto> getRecommendations() {
        return redistributionService.generateRecommendations(dataStore.getAllPHCs(), dataStore, dataStore.getSimDate());
    }

    @PostMapping("/recommendations/apply")
    public ApplyResponse applyRecommendations(@RequestBody(required = false) ApplyRequest request) {
        List<RecommendationDto> recs = redistributionService.generateRecommendations(
                dataStore.getAllPHCs(), dataStore, dataStore.getSimDate());

        Set<String> targetIds = (request != null && request.ids() != null && !request.ids().isEmpty())
                ? new HashSet<>(request.ids())
                : null; // null means apply all

        int applied = 0;
        for (RecommendationDto rec : recs) {
            if (targetIds == null || targetIds.contains(rec.id())) {
                Optional<PHC> fromOpt = dataStore.getPHCById(rec.from().id());
                Optional<PHC> toOpt = dataStore.getPHCById(rec.to().id());

                if (fromOpt.isPresent() && toOpt.isPresent()) {
                    MedicineStock fromStock = fromOpt.get().getMedicineStock(rec.medicine());
                    MedicineStock toStock = toOpt.get().getMedicineStock(rec.medicine());

                    if (fromStock != null && toStock != null) {
                        double amt = Math.min(rec.quantity(), fromStock.getQuantity());
                        fromStock.addQuantity(-amt);
                        toStock.addQuantity(amt);
                        dataStore.updateStockInDb(fromOpt.get().getId(), rec.medicine(), fromStock.getQuantity());
                        dataStore.updateStockInDb(toOpt.get().getId(), rec.medicine(), toStock.getQuantity());
                        dataStore.recordTransferAudit(rec.id(), rec.medicine(), amt,
                                fromOpt.get().getId(), toOpt.get().getId(), rec.distanceKm(), rec.crossState());
                        applied++;
                    }
                }
            }
        }

        return new ApplyResponse(applied);
    }

    @PostMapping("/simulate/outbreak")
    public SimpleOkResponse setOutbreak(@RequestBody OutbreakRequest request) {
        if (request != null && request.state() != null && request.medicine() != null && request.multiplier() != null) {
            dataStore.setOutbreakMultiplier(request.state(), request.medicine(), request.multiplier());
        }
        return new SimpleOkResponse(true);
    }

    @PostMapping("/simulate/advance")
    public AdvanceResponse advanceSimulation(@RequestParam(defaultValue = "3") int days) {
        int d = Math.max(1, Math.min(14, days));
        Random rng = new Random(42 + dataStore.getSimDate().getDayOfYear());

        for (int step = 0; step < d; step++) {
            LocalDate nextDay = dataStore.getSimDate().plusDays(1);
            int dow = nextDay.getDayOfWeek().getValue() % 7;
            double seasonality = 1.0 + 0.22 * Math.sin(2.0 * Math.PI * dow / 7.0)
                    + 0.10 * Math.cos(2.0 * Math.PI * dow / 7.0);

            for (PHC phc : dataStore.getAllPHCs()) {
                double noiseScale = phc.getState().equalsIgnoreCase("UP") ? 0.16 : 0.06;

                for (String med : DataStore.MEDICINES) {
                    MedicineStock stock = phc.getMedicineStock(med);
                    if (stock == null) continue;

                    double mult = dataStore.getOutbreakMultiplier(phc.getState(), med);
                    // Approximate baseline demand from recent history
                    List<DailyConsumption> hist = stock.getHistory();
                    double base = hist.isEmpty() ? 30.0 : hist.get(hist.size() - 1).units() / mult;
                    double noise = rng.nextGaussian() * noiseScale;
                    double consumed = Math.max(1.0, Math.round(base * seasonality * mult * (1.0 + noise) * 10.0) / 10.0);

                    stock.setQuantity(Math.max(0.0, stock.getQuantity() - consumed));
                    stock.addConsumption(new DailyConsumption(nextDay.toString(), consumed));
                    dataStore.updateStockInDb(phc.getId(), med, stock.getQuantity());
                    dataStore.recordDailyConsumptionInDb(phc.getId(), med, nextDay.toString(), consumed);
                }
            }
            dataStore.setSimDate(nextDay);
        }

        return new AdvanceResponse(dataStore.getSimDate().toString());
    }

    @PostMapping("/simulate/reset")
    public SimpleOkResponse resetSimulation() {
        dataStore.reset();
        federatedLearningService.train();
        return new SimpleOkResponse(true);
    }

    @GetMapping("/impact")
    public ImpactResponse getImpact() {
        return impactService.calculateImpact(dataStore);
    }

    @GetMapping("/fl/metrics")
    public FLMetricsResponse getFLMetrics() {
        return federatedLearningService.getMetrics();
    }

    @PostMapping("/fl/train")
    public FLMetricsResponse trainFL() {
        return federatedLearningService.train();
    }

    @GetMapping("/health")
    public HealthResponse getHealth() {
        return new HealthResponse(
                "UP",
                dataStore.getAllPHCs().size(),
                DataStore.STATES.size(),
                geminiService.isConfigured(),
                "1.0.0"
        );
    }

    @GetMapping("/scale-test")
    public ScaleTestResponse runScaleTest(@RequestParam(defaultValue = "1000") int phcs) {
        int n = Math.min(5000, Math.max(10, phcs));
        long startMs = System.currentTimeMillis();

        // Generate synthetic PHCs on copies of data (never real store)
        Random rng = new Random(42);
        List<PHC> original = dataStore.getAllPHCs();
        int baseSize = original.size();
        List<PHC> synthList = new ArrayList<>(n);

        for (int i = 0; i < n; i++) {
            PHC template = original.get(i % baseSize);
            String newId = "scale-phc-" + (i + 1);
            Map<String, MedicineStock> copyMap = new HashMap<>();
            for (Map.Entry<String, MedicineStock> e : template.getStockMap().entrySet()) {
                copyMap.put(e.getKey(), new MedicineStock(e.getValue()));
            }
            PHC synth = new PHC(newId, template.getName() + " #" + (i + 1), template.getState(), template.getDistrict(),
                    template.getLat(), template.getLng(), template.getBedsTotal(), template.getBedsOccupied(),
                    template.getStaffPresent(), template.getStaffTotal(), copyMap);
            synthList.add(synth);
        }

        // Run forecast and alert compute
        LocalDate now = dataStore.getSimDate();
        int criticalCount = 0;
        for (PHC p : synthList) {
            for (String med : DataStore.MEDICINES) {
                List<DailyConsumption> fc = forecastService.generate14DayForecast(p, med, 1.0, now);
                double avg = forecastService.calculateAvgDailyDemand(fc);
                double days = forecastService.calculateDaysOfStock(p.getMedicineStock(med).getQuantity(), avg);
                if (days < 3.0) criticalCount++;
            }
        }

        // Run recommendations compute
        redistributionService.generateRecommendations(synthList, dataStore, now);

        long elapsedMs = System.currentTimeMillis() - startMs;
        return new ScaleTestResponse(n, elapsedMs);
    }

    @PostMapping(value = "/import/stock-csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CSVImportResponse importStockCsv(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return new CSVImportResponse(0, List.of(new CSVImportResponse.RejectedRowDto(1, "Empty file provided")));
        }

        int accepted = 0;
        List<CSVImportResponse.RejectedRowDto> rejected = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            int lineNum = 0;

            while ((line = reader.readLine()) != null) {
                lineNum++;
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;

                // Handle header
                if (lineNum == 1 && line.toLowerCase().contains("phcid")) {
                    continue;
                }

                String[] parts = line.split(",");
                if (parts.length < 3) {
                    rejected.add(new CSVImportResponse.RejectedRowDto(lineNum, "Invalid column count (expected: phcId,medicine,quantity)"));
                    continue;
                }

                String phcId = parts[0].trim();
                String medicine = parts[1].trim();
                String qtyStr = parts[2].trim();

                Optional<PHC> phcOpt = dataStore.getPHCById(phcId);
                if (phcOpt.isEmpty()) {
                    rejected.add(new CSVImportResponse.RejectedRowDto(lineNum, "Unknown PHC ID: " + phcId));
                    continue;
                }

                if (!DataStore.MEDICINES.contains(medicine)) {
                    rejected.add(new CSVImportResponse.RejectedRowDto(lineNum, "Unknown medicine: " + medicine));
                    continue;
                }

                double qty;
                try {
                    qty = Double.parseDouble(qtyStr);
                    if (qty < 0) {
                        rejected.add(new CSVImportResponse.RejectedRowDto(lineNum, "Quantity cannot be negative: " + qtyStr));
                        continue;
                    }
                } catch (NumberFormatException e) {
                    rejected.add(new CSVImportResponse.RejectedRowDto(lineNum, "Invalid numeric quantity: " + qtyStr));
                    continue;
                }

                MedicineStock stock = phcOpt.get().getMedicineStock(medicine);
                if (stock != null) {
                    stock.setQuantity(qty);
                    dataStore.updateStockInDb(phcId, medicine, qty);
                    accepted++;
                } else {
                    rejected.add(new CSVImportResponse.RejectedRowDto(lineNum, "Medicine not tracked at PHC"));
                }
            }
        } catch (Exception e) {
            rejected.add(new CSVImportResponse.RejectedRowDto(0, "Error reading CSV: " + e.getMessage()));
        }

        return new CSVImportResponse(accepted, rejected);
    }

    // AI Endpoints
    @PostMapping("/ai/explain-alert")
    public AIExplainResponse explainAlert(@RequestBody ExplainAlertRequest request) {
        if (request == null || request.phcId() == null || request.medicine() == null) {
            return new AIExplainResponse("Invalid alert query.", "Missing parameters.", "Verify PHC and medicine.", "MEDIUM", "fallback");
        }

        PHC phc = dataStore.getPHCById(request.phcId())
                .orElseThrow(() -> new ResourceNotFoundException("PHC not found: " + request.phcId()));

        MedicineStock stock = phc.getMedicineStock(request.medicine());
        if (stock == null) {
            return new AIExplainResponse("Medicine not found at PHC.", "Not stocked.", "No action.", "OK", "fallback");
        }

        double outbreakMult = dataStore.getOutbreakMultiplier(phc.getState(), request.medicine());
        List<DailyConsumption> forecast = forecastService.generate14DayForecast(phc, request.medicine(), outbreakMult, dataStore.getSimDate());
        double avgDemand = forecastService.calculateAvgDailyDemand(forecast);
        double daysOfStock = forecastService.calculateDaysOfStock(stock.getQuantity(), avgDemand);

        return geminiService.explainAlert(phc, request.medicine(), daysOfStock, avgDemand, stock.getQuantity(), request.lang());
    }

    @PostMapping("/ai/situation-brief")
    public AISituationBriefResponse getSituationBrief(@RequestBody(required = false) SituationBriefRequest request) {
        String state = (request != null) ? request.state() : null;
        String lang = (request != null) ? request.lang() : "en";

        List<AlertDto> alerts = getAlerts(state);
        List<RecommendationDto> recs = getRecommendations();
        int totalPhcs = (state != null && !state.isBlank())
                ? (int) dataStore.getAllPHCs().stream().filter(p -> p.getState().equalsIgnoreCase(state)).count()
                : dataStore.getAllPHCs().size();

        return geminiService.situationBrief(state, alerts, recs, totalPhcs, lang);
    }

    @PostMapping("/ai/ask")
    public AIAskResponse askAI(@RequestBody AskQuestionRequest request) {
        if (request == null || request.question() == null || request.question().isBlank()) {
            return new AIAskResponse("Please enter a question.", "fallback");
        }

        List<AlertDto> alerts = getAlerts(request.state());
        SummaryResponse summary = getSummary();

        return geminiService.askQuestion(request.question(), request.state(), alerts, summary, request.lang());
    }

    @PostMapping(value = "/ai/ingest-register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<ExtractedMedicineRow> ingestRegister(@RequestParam("file") MultipartFile file,
                                                    @RequestParam(value = "phcId", required = false) String phcId) {
        try {
            byte[] bytes = file.getBytes();
            String contentType = file.getContentType();
            return geminiService.ingestRegister(bytes, contentType);
        } catch (Exception e) {
            return geminiService.ingestRegister(null, null);
        }
    }

    @PostMapping("/ai/ingest-register/confirm")
    public SimpleOkResponse confirmRegister(@RequestBody ConfirmRegisterRequest request) {
        if (request != null && request.phcId() != null && request.rows() != null) {
            Optional<PHC> phcOpt = dataStore.getPHCById(request.phcId());
            if (phcOpt.isPresent()) {
                PHC phc = phcOpt.get();
                for (ConfirmRegisterRequest.RegisterRowDto row : request.rows()) {
                    MedicineStock stock = phc.getMedicineStock(row.medicine());
                    if (stock != null && row.quantity() >= 0) {
                        stock.setQuantity(row.quantity());
                        dataStore.updateStockInDb(request.phcId(), row.medicine(), row.quantity());
                    }
                }
            }
        }
        return new SimpleOkResponse(true);
    }
}
