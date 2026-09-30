package com.sahamatrix.dto;

import java.util.List;

public record ConfirmRegisterRequest(
    String phcId,
    List<RegisterRowDto> rows
) {
    public record RegisterRowDto(
        String medicine,
        double quantity
    ) {}
}
