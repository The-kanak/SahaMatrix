package com.sahamatrix.service;

import com.sahamatrix.dto.LocationNodeDto;
import com.sahamatrix.dto.RecommendationDto;
import com.sahamatrix.model.DailyConsumption;
import com.sahamatrix.model.MedicineStock;
import com.sahamatrix.model.PHC;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class RedistributionService {

    private final ForecastService forecastService;

    public RedistributionService(ForecastService forecastService) {
        this.forecastService = forecastService;
    }

    public static class Candidate {
        final PHC phc;
        final double avgDailyDemand;
        final double currentStock;
        final double daysOfStock;
        double remainingSurplus;
        double remainingNeeded;

        public Candidate(PHC phc, double avgDailyDemand, double currentStock, double daysOfStock) {
            this.phc = phc;
            this.avgDailyDemand = avgDailyDemand;
            this.currentStock = currentStock;
            this.daysOfStock = daysOfStock;
            // Surplus PHC: daysOfStock > 30, transferable = stock - 20 days of demand
            this.remainingSurplus = (daysOfStock > 30.0) ? Math.max(0.0, currentStock - (20.0 * avgDailyDemand)) : 0.0;
            // Deficit PHC: daysOfStock < 7, needed = 14 days of demand - stock
            this.remainingNeeded = (daysOfStock < 7.0) ? Math.max(0.0, (14.0 * avgDailyDemand) - currentStock) : 0.0;
        }
    }

    public List<RecommendationDto> generateRecommendations(Collection<PHC> phcs, DataStore dataStore, LocalDate simDate) {
        List<RecommendationDto> recommendations = new ArrayList<>();

        for (String medicine : DataStore.MEDICINES) {
            List<Candidate> deficitCandidates = new ArrayList<>();
            List<Candidate> surplusCandidates = new ArrayList<>();

            for (PHC phc : phcs) {
                MedicineStock stock = phc.getMedicineStock(medicine);
                if (stock == null) continue;

                double outbreakMult = dataStore.getOutbreakMultiplier(phc.getState(), medicine);
                List<DailyConsumption> forecast = forecastService.generate14DayForecast(phc, medicine, outbreakMult, simDate);
                double avgDailyDemand = forecastService.calculateAvgDailyDemand(forecast);
                double daysOfStock = forecastService.calculateDaysOfStock(stock.getQuantity(), avgDailyDemand);

                if (daysOfStock < 7.0) {
                    deficitCandidates.add(new Candidate(phc, avgDailyDemand, stock.getQuantity(), daysOfStock));
                } else if (daysOfStock > 30.0) {
                    surplusCandidates.add(new Candidate(phc, avgDailyDemand, stock.getQuantity(), daysOfStock));
                }
            }

            // Sort deficit PHCs worst first (lowest daysOfStock ascending)
            deficitCandidates.sort(Comparator.comparingDouble(c -> c.daysOfStock));

            int recSeq = 1;
            for (Candidate deficit : deficitCandidates) {
                while (deficit.remainingNeeded >= 1.0) {
                    // Try same-state surplus first
                    Candidate bestSurplus = findNearestSurplus(deficit.phc, surplusCandidates, true);

                    // If no same-state surplus remains, look across states
                    boolean crossState = false;
                    if (bestSurplus == null) {
                        bestSurplus = findNearestSurplus(deficit.phc, surplusCandidates, false);
                        crossState = true;
                    }

                    if (bestSurplus == null) {
                        break;
                    }

                    double transferAmount = Math.min(deficit.remainingNeeded, bestSurplus.remainingSurplus);
                    transferAmount = Math.round(transferAmount);
                    if (transferAmount < 1.0) {
                        bestSurplus.remainingSurplus = 0.0;
                        continue;
                    }

                    bestSurplus.remainingSurplus -= transferAmount;
                    deficit.remainingNeeded -= transferAmount;

                    double dist = haversineDistance(
                            bestSurplus.phc.getLat(), bestSurplus.phc.getLng(),
                            deficit.phc.getLat(), deficit.phc.getLng()
                    );
                    dist = Math.round(dist * 10.0) / 10.0;

                    String recId = String.format("rec-%s-%s-%s-%d",
                            medicine.toLowerCase().replaceAll("[^a-z0-9]", ""),
                            bestSurplus.phc.getId(),
                            deficit.phc.getId(),
                            recSeq++
                    );

                    recommendations.add(new RecommendationDto(
                            recId,
                            medicine,
                            transferAmount,
                            dist,
                            crossState,
                            new LocationNodeDto(
                                    bestSurplus.phc.getId(),
                                    bestSurplus.phc.getName(),
                                    bestSurplus.phc.getState(),
                                    bestSurplus.phc.getLat(),
                                    bestSurplus.phc.getLng()
                            ),
                            new LocationNodeDto(
                                    deficit.phc.getId(),
                                    deficit.phc.getName(),
                                    deficit.phc.getState(),
                                    deficit.phc.getLat(),
                                    deficit.phc.getLng()
                            )
                    ));
                }
            }
        }

        return recommendations;
    }

    private Candidate findNearestSurplus(PHC target, List<Candidate> candidates, boolean sameStateOnly) {
        Candidate nearest = null;
        double minDistance = Double.MAX_VALUE;

        for (Candidate c : candidates) {
            if (c.remainingSurplus < 1.0) continue;
            boolean matchesState = c.phc.getState().equalsIgnoreCase(target.getState());
            if (sameStateOnly && !matchesState) continue;
            if (!sameStateOnly && matchesState) continue;

            double dist = haversineDistance(target.getLat(), target.getLng(), c.phc.getLat(), c.phc.getLng());
            if (dist < minDistance) {
                minDistance = dist;
                nearest = c;
            }
        }

        return nearest;
    }

    public static double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
