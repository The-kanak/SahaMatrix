package com.sahamatrix.dto;

import java.util.List;

public record CSVImportResponse(
    int accepted,
    List<RejectedRowDto> rejected
) {
    public record RejectedRowDto(
        int row,
        String reason
    ) {}
}
