package com.sahamatrix.dto;

import com.sahamatrix.model.DailyConsumption;
import java.util.List;

public record ForecastResponse(
    List<DailyConsumption> history,
    List<DailyConsumption> forecast
) {}
