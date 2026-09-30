package com.sahamatrix.service;

import com.sahamatrix.entity.*;
import com.sahamatrix.model.DailyConsumption;
import com.sahamatrix.model.MedicineStock;
import com.sahamatrix.model.PHC;
import com.sahamatrix.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class DataStore {

    public static final List<String> MEDICINES = List.of(
            "Paracetamol",
            "ORS",
            "Amoxicillin",
            "Insulin",
            "Artemisinin ACT"
    );

    public static final List<String> STATES = List.of("MH", "UP", "TN");

    public static final Map<String, String> STATE_NAMES = Map.of(
            "MH", "Maharashtra",
            "UP", "Uttar Pradesh",
            "TN", "Tamil Nadu"
    );

    public static final LocalDate INITIAL_DATE = LocalDate.of(2026, 10, 1);

    private final ForecastService forecastService;
    private final StateRepository stateRepository;
    private final DistrictRepository districtRepository;
    private final PhcRepository phcRepository;
    private final MedicineRepository medicineRepository;
    private final PhcStockRepository phcStockRepository;
    private final DailyConsumptionRepository dailyConsumptionRepository;
    private final TransferAuditRepository transferAuditRepository;

    private final Map<String, PHC> phcMap = new ConcurrentHashMap<>();
    private final List<PHC> phcList = new ArrayList<>();
    private final Map<String, Double> outbreakMultipliers = new ConcurrentHashMap<>();
    private volatile LocalDate simDate = INITIAL_DATE;

    public DataStore(ForecastService forecastService,
                     StateRepository stateRepository,
                     DistrictRepository districtRepository,
                     PhcRepository phcRepository,
                     MedicineRepository medicineRepository,
                     PhcStockRepository phcStockRepository,
                     DailyConsumptionRepository dailyConsumptionRepository,
                     TransferAuditRepository transferAuditRepository) {
        this.forecastService = forecastService;
        this.stateRepository = stateRepository;
        this.districtRepository = districtRepository;
        this.phcRepository = phcRepository;
        this.medicineRepository = medicineRepository;
        this.phcStockRepository = phcStockRepository;
        this.dailyConsumptionRepository = dailyConsumptionRepository;
        this.transferAuditRepository = transferAuditRepository;
    }

    @PostConstruct
    public synchronized void init() {
        try {
            if (phcRepository.count() == 0) {
                seedDatabase();
            }
            loadFromDatabase();
        } catch (Exception e) {
            System.err.println("Warning: Could not connect to MySQL database (" + e.getMessage() + "). Falling back to in-memory seed.");
            resetInMemoryOnly();
        }
    }

    @Transactional
    public synchronized void seedDatabase() {
        Random rng = new Random(42);

        // 1. Seed States
        for (String code : STATES) {
            stateRepository.save(new StateEntity(code, STATE_NAMES.get(code)));
        }

        // 2. Seed Medicines
        for (String med : MEDICINES) {
            String unit = med.equals("Paracetamol") || med.equals("Amoxicillin") ? "Tablets" :
                    med.equals("ORS") ? "Sachets" :
                    med.equals("Insulin") ? "Vials" : "Blisters";
            medicineRepository.save(new MedicineEntity(med.toLowerCase().replace(" ", "-"), med, unit));
        }

        // 3. Generate PHCs with 60 days of consumption
        List<PHC> generated = generatePHCs(rng);

        for (PHC phc : generated) {
            phcRepository.save(new PhcEntity(
                    phc.getId(), phc.getName(), phc.getState(), phc.getDistrict(),
                    phc.getLat(), phc.getLng(), phc.getBedsTotal(), phc.getBedsOccupied(),
                    phc.getStaffTotal(), phc.getStaffPresent()
            ));

            for (Map.Entry<String, MedicineStock> entry : phc.getStockMap().entrySet()) {
                String med = entry.getKey();
                MedicineStock stock = entry.getValue();

                phcStockRepository.save(new PhcStockEntity(phc.getId(), med, stock.getQuantity()));

                for (DailyConsumption dc : stock.getHistory()) {
                    dailyConsumptionRepository.save(new DailyConsumptionEntity(phc.getId(), med, dc.date(), dc.units()));
                }
            }
        }
    }

    public synchronized void loadFromDatabase() {
        phcMap.clear();
        phcList.clear();
        outbreakMultipliers.clear();
        simDate = INITIAL_DATE;

        List<PhcEntity> phcEntities = phcRepository.findAll();

        for (PhcEntity entity : phcEntities) {
            Map<String, MedicineStock> stockMap = new LinkedHashMap<>();
            List<PhcStockEntity> stockEntities = phcStockRepository.findByPhcId(entity.getId());

            for (PhcStockEntity stockEntity : stockEntities) {
                String med = stockEntity.getMedicine();
                List<DailyConsumptionEntity> dcEntities = dailyConsumptionRepository
                        .findByPhcIdAndMedicineOrderByRecordDateAsc(entity.getId(), med);

                List<DailyConsumption> history = new ArrayList<>();
                for (DailyConsumptionEntity dc : dcEntities) {
                    history.add(new DailyConsumption(dc.getRecordDate(), dc.getUnits()));
                }

                stockMap.put(med, new MedicineStock(med, stockEntity.getQuantity(), history));
            }

            PHC phc = new PHC(
                    entity.getId(), entity.getName(), entity.getState(), entity.getDistrict(),
                    entity.getLat(), entity.getLng(), entity.getBedsTotal(), entity.getBedsOccupied(),
                    entity.getStaffPresent(), entity.getStaffTotal(), stockMap
            );

            phcMap.put(phc.getId(), phc);
            phcList.add(phc);
        }
    }

    public synchronized void updateStockInDb(String phcId, String medicine, double newQuantity) {
        try {
            Optional<PhcStockEntity> stockOpt = phcStockRepository.findByPhcIdAndMedicine(phcId, medicine);
            if (stockOpt.isPresent()) {
                PhcStockEntity entity = stockOpt.get();
                entity.setQuantity(newQuantity);
                phcStockRepository.save(entity);
            } else {
                phcStockRepository.save(new PhcStockEntity(phcId, medicine, newQuantity));
            }
        } catch (Exception e) {
            System.err.println("Warning: Failed to update stock in MySQL: " + e.getMessage());
        }
    }

    public synchronized void recordDailyConsumptionInDb(String phcId, String medicine, String recordDate, double units) {
        try {
            dailyConsumptionRepository.save(new DailyConsumptionEntity(phcId, medicine, recordDate, units));
        } catch (Exception e) {
            System.err.println("Warning: Failed to persist daily consumption to MySQL: " + e.getMessage());
        }
    }

    public synchronized void recordTransferAudit(String transferId, String medicine, double quantity,
                                                String fromPhcId, String toPhcId, double distanceKm,
                                                boolean crossState) {
        try {
            transferAuditRepository.save(new TransferAuditEntity(
                    transferId, medicine, quantity, fromPhcId, toPhcId,
                    distanceKm, crossState, LocalDateTime.now().toString()
            ));
        } catch (Exception e) {
            System.err.println("Warning: Failed to record transfer audit in MySQL: " + e.getMessage());
        }
    }

    @Transactional
    public synchronized void reset() {
        try {
            dailyConsumptionRepository.deleteAll();
            phcStockRepository.deleteAll();
            phcRepository.deleteAll();
            transferAuditRepository.deleteAll();
            seedDatabase();
            loadFromDatabase();
        } catch (Exception e) {
            System.err.println("Warning: Reset in MySQL failed, resetting in memory: " + e.getMessage());
            resetInMemoryOnly();
        }
    }

    private synchronized void resetInMemoryOnly() {
        phcMap.clear();
        phcList.clear();
        outbreakMultipliers.clear();
        simDate = INITIAL_DATE;

        Random rng = new Random(42);
        List<PHC> generated = generatePHCs(rng);
        for (PHC phc : generated) {
            phcMap.put(phc.getId(), phc);
            phcList.add(phc);
        }
    }

    private List<PHC> generatePHCs(Random rng) {
        List<PHC> result = new ArrayList<>();

        DistrictDef[] mhDistricts = {
                new DistrictDef("Nagpur", 21.1458, 79.0882, new String[]{
                        "Nagpur Central PHC", "Sitabuldi Urban Health Centre", "Dharampeth Primary Clinic",
                        "Kamptee Community Health Centre", "Hingna Rural Hospital", "Umred Primary Health Centre"
                }),
                new DistrictDef("Pune", 18.5204, 73.8567, new String[]{
                        "Shivajinagar Urban Health Post", "Kothrud Primary Clinic", "Hadapsar Health Centre",
                        "Pimpri Community Health Unit", "Baramati Rural Dispensary", "Shirur Primary Health Centre"
                }),
                new DistrictDef("Nashik", 19.9975, 73.7898, new String[]{
                        "Panchavati Primary Health Centre", "Nashik Road Urban Clinic", "Deolali Cantonment Health Post",
                        "Sinnar Community Health Unit", "Ozar Rural Health Centre", "Trimbak Primary Dispensary"
                }),
                new DistrictDef("Aurangabad", 19.8762, 75.3433, new String[]{
                        "Cidco Urban Health Centre", "Kranti Chowk Primary Clinic", "Waluj Industrial Health Post",
                        "Paithan Rural Health Centre", "Gangapur Community Clinic", "Khuldabad Primary Health Centre"
                })
        };

        DistrictDef[] upDistricts = {
                new DistrictDef("Lucknow", 26.8467, 80.9462, new String[]{
                        "Hazratganj Urban PHC", "Alambagh Primary Health Centre", "Gomti Nagar Health Post",
                        "Indira Nagar Community Clinic", "Bakshi Ka Talab Rural PHC", "Malihabad Community Hospital"
                }),
                new DistrictDef("Varanasi", 25.3176, 82.9739, new String[]{
                        "Cantonment Urban Health Post", "Bhelupur Primary Clinic", "Sigra Community Health Unit",
                        "Shivpur Urban PHC", "Pindra Rural Health Centre", "Rohania Primary Health Centre"
                }),
                new DistrictDef("Kanpur", 26.4499, 80.3319, new String[]{
                        "Civil Lines Primary Health Post", "Govind Nagar Urban PHC", "Kalyanpur Health Centre",
                        "Kidwai Nagar Community Clinic", "Bilhaur Rural Health Unit", "Ghatampur Primary Health Centre"
                }),
                new DistrictDef("Gorakhpur", 26.7606, 83.3732, new String[]{
                        "Golghar Urban PHC", "Gorakhnath Health Post", "Medical College Road Clinic",
                        "Sahjanwa Community Health Centre", "Campierganj Rural PHC", "Pipraich Primary Health Unit"
                })
        };

        DistrictDef[] tnDistricts = {
                new DistrictDef("Chennai", 13.0827, 80.2707, new String[]{
                        "T Nagar Urban Health Centre", "Mylapore Primary Clinic", "Anna Nagar Community Health Post",
                        "Adyar Primary Health Centre", "Royapuram Urban Care Unit", "Tambaram Primary Health Centre"
                }),
                new DistrictDef("Madurai", 9.9252, 78.1198, new String[]{
                        "Meenakshi Urban Health Post", "Anna Bus Stand Primary Clinic", "Sellur Community Health Centre",
                        "Villapuram Primary Health Centre", "Melur Rural Health Unit", "Usilampatti Community Clinic"
                }),
                new DistrictDef("Coimbatore", 11.0168, 76.9558, new String[]{
                        "Gandhipuram Urban Health Centre", "RS Puram Primary Clinic", "Peelamedu Community Health Post",
                        "Singanallur Health Centre", "Pollachi Rural PHC", "Mettupalayam Primary Health Post"
                }),
                new DistrictDef("Salem", 11.6643, 78.1460, new String[]{
                        "Salem Town Primary Clinic", "Shevapet Urban Health Centre", "Hasthampatti Health Post",
                        "Suramangalam Community Clinic", "Attur Rural Health Centre", "Mettur Primary Health Centre"
                })
        };

        result.addAll(buildStatePHCs("MH", mhDistricts, rng, 0.05));
        result.addAll(buildStatePHCs("UP", upDistricts, rng, 0.16));
        result.addAll(buildStatePHCs("TN", tnDistricts, rng, 0.06));

        return result;
    }

    private List<PHC> buildStatePHCs(String stateCode, DistrictDef[] districts, Random rng, double noiseScale) {
        List<PHC> list = new ArrayList<>();
        int count = 1;

        Map<String, Set<Integer>> lowIndicesPerMedicine = new HashMap<>();
        Map<String, Set<Integer>> overstockedIndicesPerMedicine = new HashMap<>();

        for (int m = 0; m < MEDICINES.size(); m++) {
            String med = MEDICINES.get(m);
            Set<Integer> low = new HashSet<>();
            Set<Integer> over = new HashSet<>();
            int offset = (m * 4) % 24;

            int lowCount = (m % 2 == 0) ? 4 : 3;
            for (int k = 0; k < lowCount; k++) {
                low.add((offset + k) % 24);
            }
            int overCount = (m % 2 == 0) ? 3 : 4;
            for (int k = 0; k < overCount; k++) {
                over.add((offset + 10 + k) % 24);
            }

            lowIndicesPerMedicine.put(med, low);
            overstockedIndicesPerMedicine.put(med, over);
        }

        int phcIndex = 0;
        for (DistrictDef dist : districts) {
            // Save district in repository if not present
            try {
                districtRepository.save(new DistrictEntity(
                        dist.districtName.toLowerCase().replace(" ", "-"),
                        stateCode, dist.districtName, dist.centerLat, dist.centerLng
                ));
            } catch (Exception ignored) {}

            for (int i = 0; i < dist.phcNames.length; i++) {
                String id = String.format("phc-%s-%02d", stateCode.toLowerCase(), count++);
                String name = dist.phcNames[i];
                double lat = dist.centerLat + (rng.nextDouble() - 0.5) * 0.10;
                double lng = dist.centerLng + (rng.nextDouble() - 0.5) * 0.10;
                int bedsTotal = 20 + rng.nextInt(31);
                int bedsOccupied = 10 + rng.nextInt(bedsTotal - 10);
                int staffTotal = 10 + rng.nextInt(16);
                int staffPresent = 6 + rng.nextInt(staffTotal - 5);

                Map<String, MedicineStock> stockMap = new LinkedHashMap<>();

                for (String medicine : MEDICINES) {
                    double baseDemand = 25.0 + rng.nextDouble() * 35.0;
                    List<DailyConsumption> history = new ArrayList<>();

                    for (int day = 60; day >= 1; day--) {
                        LocalDate d = INITIAL_DATE.minusDays(day);
                        int dow = d.getDayOfWeek().getValue() % 7;
                        double seasonality = 1.0 + 0.22 * Math.sin(2.0 * Math.PI * dow / 7.0)
                                + 0.10 * Math.cos(2.0 * Math.PI * dow / 7.0);
                        double trend = 1.0 + 0.001 * (60 - day);
                        double noise = rng.nextGaussian() * noiseScale;
                        double units = Math.max(1.0, Math.round(baseDemand * seasonality * trend * (1.0 + noise) * 10.0) / 10.0);
                        history.add(new DailyConsumption(d.toString(), units));
                    }

                    MedicineStock tempStock = new MedicineStock(medicine, 100.0, history);
                    PHC tempPhc = new PHC(id, name, stateCode, dist.districtName, lat, lng,
                            bedsTotal, bedsOccupied, staffPresent, staffTotal,
                            Map.of(medicine, tempStock));

                    List<DailyConsumption> forecast = forecastService.generate14DayForecast(tempPhc, medicine, 1.0, INITIAL_DATE);
                    double avgDailyDemand = forecastService.calculateAvgDailyDemand(forecast);

                    boolean isLow = lowIndicesPerMedicine.get(medicine).contains(phcIndex);
                    boolean isOver = overstockedIndicesPerMedicine.get(medicine).contains(phcIndex);

                    double initialStock;
                    if (isLow) {
                        double days = 2.0 + rng.nextDouble() * 3.5;
                        initialStock = Math.max(5.0, Math.round(days * avgDailyDemand));
                    } else if (isOver) {
                        double days = 36.0 + rng.nextDouble() * 12.0;
                        initialStock = Math.round(days * avgDailyDemand);
                    } else {
                        double days = 12.0 + rng.nextDouble() * 14.0;
                        initialStock = Math.round(days * avgDailyDemand);
                    }

                    stockMap.put(medicine, new MedicineStock(medicine, initialStock, history));
                }

                PHC phc = new PHC(id, name, stateCode, dist.districtName, lat, lng,
                        bedsTotal, bedsOccupied, staffPresent, staffTotal, stockMap);
                list.add(phc);
                phcIndex++;
            }
        }

        return list;
    }

    public synchronized List<PHC> getAllPHCs() {
        return Collections.unmodifiableList(new ArrayList<>(phcList));
    }

    public synchronized Optional<PHC> getPHCById(String id) {
        return Optional.ofNullable(phcMap.get(id));
    }

    public synchronized LocalDate getSimDate() {
        return simDate;
    }

    public synchronized void setSimDate(LocalDate date) {
        this.simDate = date;
    }

    public synchronized void advanceSimDate(int days) {
        this.simDate = this.simDate.plusDays(days);
    }

    public synchronized double getOutbreakMultiplier(String state, String medicine) {
        String key = state.toUpperCase() + ":" + medicine;
        return outbreakMultipliers.getOrDefault(key, 1.0);
    }

    public synchronized void setOutbreakMultiplier(String state, String medicine, double multiplier) {
        String key = state.toUpperCase() + ":" + medicine;
        outbreakMultipliers.put(key, Math.max(1.0, multiplier));
    }

    public synchronized Map<String, Double> getAllOutbreakMultipliers() {
        return Collections.unmodifiableMap(new LinkedHashMap<>(outbreakMultipliers));
    }

    private record DistrictDef(String districtName, double centerLat, double centerLng, String[] phcNames) {}
}
