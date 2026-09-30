package com.sahamatrix.service;

import com.sahamatrix.model.DailyConsumption;
import com.sahamatrix.model.MedicineStock;
import com.sahamatrix.model.PHC;
import com.sahamatrix.model.RiskLevel;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ForecastService {

    public List<DailyConsumption> generate14DayForecast(PHC phc, String medicine, double outbreakMultiplier, LocalDate simDate) {
        MedicineStock stock = phc.getMedicineStock(medicine);
        if (stock == null) {
            return List.of();
        }
        List<DailyConsumption> history = stock.getHistory();
        int n = history.size();
        if (n < 28) {
            // Fallback if not enough history
            double fallback = n > 0 ? history.get(n - 1).units() : 30.0;
            List<DailyConsumption> forecast = new ArrayList<>();
            for (int i = 0; i < 14; i++) {
                forecast.add(new DailyConsumption(simDate.plusDays(i).toString(), Math.round(fallback * outbreakMultiplier * 10.0) / 10.0));
            }
            return forecast;
        }

        // Use last 28 days for DOW average and trend
        List<DailyConsumption> last28 = history.subList(n - 28, n);

        // Compute trend slope factor: compare first 14 days to second 14 days
        double sumFirst14 = 0;
        for (int i = 0; i < 14; i++) {
            sumFirst14 += last28.get(i).units();
        }
        double meanFirst14 = sumFirst14 / 14.0;

        double sumSecond14 = 0;
        for (int i = 14; i < 28; i++) {
            sumSecond14 += last28.get(i).units();
        }
        double meanSecond14 = sumSecond14 / 14.0;

        double trendSlopeFactor = (meanSecond14 - meanFirst14) / (meanFirst14 + 1.0);
        // Clamp trend slope to [-0.15, 0.15] for stability
        trendSlopeFactor = Math.max(-0.15, Math.min(0.15, trendSlopeFactor));

        List<DailyConsumption> forecast = new ArrayList<>();
        for (int day = 0; day < 14; day++) {
            LocalDate targetDate = simDate.plusDays(day);
            int targetDow = targetDate.getDayOfWeek().getValue(); // 1 = Monday, 7 = Sunday

            // Average of the 4 matching days of week in the 28-day window
            double dowSum = 0;
            int dowCount = 0;
            for (DailyConsumption dc : last28) {
                LocalDate d = LocalDate.parse(dc.date());
                if (d.getDayOfWeek().getValue() == targetDow) {
                    dowSum += dc.units();
                    dowCount++;
                }
            }
            double dowAvg = dowCount > 0 ? (dowSum / dowCount) : meanSecond14;

            double projectedTrend = 1.0 + (trendSlopeFactor * ((day + 1.0) / 14.0));
            double forecastedUnits = dowAvg * projectedTrend * outbreakMultiplier;
            forecastedUnits = Math.max(1.0, Math.round(forecastedUnits * 10.0) / 10.0);

            forecast.add(new DailyConsumption(targetDate.toString(), forecastedUnits));
        }

        return forecast;
    }

    public double calculateAvgDailyDemand(List<DailyConsumption> forecast) {
        if (forecast == null || forecast.isEmpty()) {
            return 1.0;
        }
        double sum = 0;
        for (DailyConsumption dc : forecast) {
            sum += dc.units();
        }
        return Math.round((sum / forecast.size()) * 10.0) / 10.0;
    }

    public double calculateDaysOfStock(double stock, double avgDailyDemand) {
        if (avgDailyDemand <= 0.001) {
            return 999.0;
        }
        return Math.round((stock / avgDailyDemand) * 10.0) / 10.0;
    }

    public RiskLevel calculateRiskLevel(double daysOfStock) {
        if (daysOfStock < 3.0) {
            return RiskLevel.CRITICAL;
        } else if (daysOfStock < 7.0) {
            return RiskLevel.HIGH;
        } else if (daysOfStock < 14.0) {
            return RiskLevel.MEDIUM;
        } else {
            return RiskLevel.OK;
        }
    }

    public RiskLevel worstRisk(RiskLevel a, RiskLevel b) {
        if (a == RiskLevel.CRITICAL || b == RiskLevel.CRITICAL) return RiskLevel.CRITICAL;
        if (a == RiskLevel.HIGH || b == RiskLevel.HIGH) return RiskLevel.HIGH;
        if (a == RiskLevel.MEDIUM || b == RiskLevel.MEDIUM) return RiskLevel.MEDIUM;
        return RiskLevel.OK;
    }
}
