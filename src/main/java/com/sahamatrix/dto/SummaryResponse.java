package com.sahamatrix.dto;

import java.util.List;

public record SummaryResponse(
    String simDate,
    TotalsDto totals,
    List<StateSummaryDto> states
) {
    public record TotalsDto(
        int phcs,
        int criticalAlerts,
        int highAlerts,
        int recommendations
    ) {}

    public record StateSummaryDto(
        String code,
        String name,
        int phcCount,
        int criticalCount,
        int highCount
    ) {}
}
