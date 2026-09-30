package com.sahamatrix.dto;

import com.sahamatrix.model.RiskLevel;

public record StockDetailDto(
    String medicine,
    double quantity,
    double avgDailyDemand,
    double daysOfStock,
    RiskLevel risk
) {}
