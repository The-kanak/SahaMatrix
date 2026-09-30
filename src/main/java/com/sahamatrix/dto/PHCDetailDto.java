package com.sahamatrix.dto;

import com.sahamatrix.model.RiskLevel;
import java.util.List;

public record PHCDetailDto(
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
    int staffTotal,
    List<StockDetailDto> stock
) {}
