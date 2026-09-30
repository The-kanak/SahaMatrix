package com.sahamatrix.dto;

import com.sahamatrix.model.RiskLevel;

public record PHCSummaryDto(
    String id,
    String name,
    String state,
    String district,
    double lat,
    double lng,
    RiskLevel risk,
    double minDaysOfStock,
    int bedsTotal,
    int bedsOccupied,
    int staffPresent,
    int staffTotal
) {}
