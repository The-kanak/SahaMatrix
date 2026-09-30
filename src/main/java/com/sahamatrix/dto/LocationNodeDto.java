package com.sahamatrix.dto;

public record LocationNodeDto(
    String id,
    String name,
    String state,
    double lat,
    double lng
) {}
