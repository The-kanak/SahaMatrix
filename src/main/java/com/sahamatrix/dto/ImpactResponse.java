package com.sahamatrix.dto;

public record ImpactResponse(
    int horizonDays,
    int baselineStockouts,
    int withSahaStockouts,
    int prevented
) {}
