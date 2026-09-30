package com.sahamatrix.service;

import com.sahamatrix.dto.ImpactResponse;
import com.sahamatrix.dto.RecommendationDto;
import com.sahamatrix.model.DailyConsumption;
import com.sahamatrix.model.MedicineStock;
import com.sahamatrix.model.PHC;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class ImpactService {

    private final ForecastService forecastService;
    private final RedistributionService redistributionService;

    public ImpactService(ForecastService forecastService, RedistributionService redistributionService) {
        this.forecastService = forecastService;
        this.redistributionService = redistributionService;
    }

    public ImpactResponse calculateImpact(DataStore dataStore) {
        LocalDate simDate = dataStore.getSimDate();
        List<PHC> originalPhcs = dataStore.getAllPHCs();

        // 1. Generate current recommendations on fresh state
        List<RecommendationDto> recs = redistributionService.generateRecommendations(originalPhcs, dataStore, simDate);

        // 2. Clone PHCs for baseline simulation
        Map<String, PHC> baselineMap = new HashMap<>();
        for (PHC p : originalPhcs) {
            baselineMap.put(p.getId(), new PHC(p));
        }

        // 3. Clone PHCs for withSaha simulation
        Map<String, PHC> withSahaMap = new HashMap<>();
        for (PHC p : originalPhcs) {
            withSahaMap.put(p.getId(), new PHC(p));
        }

        // Apply ALL recommendations to withSahaMap
        for (RecommendationDto rec : recs) {
            PHC fromPhc = withSahaMap.get(rec.from().id());
            PHC toPhc = withSahaMap.get(rec.to().id());
            if (fromPhc != null && toPhc != null) {
                MedicineStock fromStock = fromPhc.getMedicineStock(rec.medicine());
                MedicineStock toStock = toPhc.getMedicineStock(rec.medicine());
                if (fromStock != null && toStock != null) {
                    double amt = Math.min(rec.quantity(), fromStock.getQuantity());
                    fromStock.addQuantity(-amt);
                    toStock.addQuantity(amt);
                }
            }
        }

        // Precompute 14-day forecasts for each PHC and medicine
        Map<String, Map<String, List<DailyConsumption>>> forecastMap = new HashMap<>();
        for (PHC p : originalPhcs) {
            Map<String, List<DailyConsumption>> medForecasts = new HashMap<>();
            for (String med : DataStore.MEDICINES) {
                double outbreakMult = dataStore.getOutbreakMultiplier(p.getState(), med);
                List<DailyConsumption> forecast = forecastService.generate14DayForecast(p, med, outbreakMult, simDate);
                medForecasts.put(med, forecast);
            }
            forecastMap.put(p.getId(), medForecasts);
        }

        int baselineStockouts = simulate14Days(baselineMap.values(), forecastMap);
        int withSahaStockouts = simulate14Days(withSahaMap.values(), forecastMap);
        int prevented = Math.max(0, baselineStockouts - withSahaStockouts);

        return new ImpactResponse(14, baselineStockouts, withSahaStockouts, prevented);
    }

    private int simulate14Days(Collection<PHC> phcs, Map<String, Map<String, List<DailyConsumption>>> forecastMap) {
        int stockoutPairs = 0;

        for (PHC phc : phcs) {
            Map<String, List<DailyConsumption>> phcForecasts = forecastMap.get(phc.getId());
            if (phcForecasts == null) continue;

            for (String med : DataStore.MEDICINES) {
                MedicineStock stock = phc.getMedicineStock(med);
                List<DailyConsumption> forecast = phcForecasts.get(med);
                if (stock == null || forecast == null) continue;

                double currentStock = stock.getQuantity();
                boolean hitZero = (currentStock <= 0.0);

                if (!hitZero) {
                    for (int day = 0; day < 14; day++) {
                        double demand = (day < forecast.size()) ? forecast.get(day).units() : 30.0;
                        currentStock -= demand;
                        if (currentStock <= 0.0) {
                            hitZero = true;
                            break;
                        }
                    }
                }

                if (hitZero) {
                    stockoutPairs++;
                }
            }
        }

        return stockoutPairs;
    }
}
