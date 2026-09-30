package com.sahamatrix.dto;

import java.util.List;

public record AISituationBriefResponse(
    List<String> brief,
    String source
) {}
