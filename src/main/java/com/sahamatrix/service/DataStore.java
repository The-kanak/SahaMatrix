package com.sahamatrix.service;

import com.sahamatrix.model.DailyConsumption;
import com.sahamatrix.model.MedicineStock;
import com.sahamatrix.model.PHC;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
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

    private final Map<String, PHC> phcMap = new ConcurrentHashMap<>();
    private final List<PHC> phcList = new ArrayList<>();
    private final Map<String, Double> outbreakMultipliers = new ConcurrentHashMap<>();
    private volatile LocalDate simDate = INITIAL_DATE;

    public DataStore(ForecastService forecastService) {
        this.forecastService = forecastService;
    }

    @PostConstruct
    public void init() {
        reset();
    }

    public synchronized void reset() {
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

        // 1. Maharashtra (MH) - Nagpur, Pune, Nashik, Aurangabad
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

        // 2. Uttar Pradesh (UP) - Lucknow, Varanasi, Kanpur, Gorakhpur (noisiest data)
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

        // 3. Tamil Nadu (TN) - Chennai, Madurai, Coimbatore, Salem
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
        result.addAll(buildStatePHCs("UP", upDistricts, rng, 0.16)); // UP noisiest
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
