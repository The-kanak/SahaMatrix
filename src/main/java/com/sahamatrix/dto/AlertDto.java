package com.sahamatrix.dto;

import com.sahamatrix.model.RiskLevel;

public record AlertDto(
    String phcId,
    String phcName,
    String state,
    String district,
    String medicine,
    double daysOfStock,
    RiskLevel severity,
    String message
) {}
