#!/usr/bin/env bash
# SahaMatrix Smoke Test Suite
# Tests every backend API endpoint and prints PASS/FAIL

PORT="${PORT:-8081}"
BASE_URL="http://localhost:${PORT}"
TOTAL=0
PASSED=0
FAILED=0

echo "=========================================="
echo " Running SahaMatrix API Smoke Tests on ${BASE_URL}"
echo "=========================================="

test_endpoint() {
    local method="$1"
    local path="$2"
    local data="$3"
    local expected_substr="$4"
    TOTAL=$((TOTAL + 1))

    local response
    if [ "$method" = "GET" ]; then
        response=$(curl -s -X GET "${BASE_URL}${path}")
    else
        response=$(curl -s -X POST "${BASE_URL}${path}" -H "Content-Type: application/json" -d "$data")
    fi

    if echo "$response" | grep -q "$expected_substr"; then
        echo "[PASS] $method $path"
        PASSED=$((PASSED + 1))
    else
        echo "[FAIL] $method $path"
        echo "       Expected substring: $expected_substr"
        echo "       Response snippet:   ${response:0:120}..."
        FAILED=$((FAILED + 1))
    fi
}

# 1. Health Check
test_endpoint "GET" "/api/health" "" "UP"

# Baseline Reset
test_endpoint "POST" "/api/simulate/reset" "" "true"

# 2. Executive Summary
test_endpoint "GET" "/api/summary" "" "simDate"

# 3. PHC Listing by State
test_endpoint "GET" "/api/phcs?state=MH" "" "phc-mh"

# 4. Single PHC Detail
test_endpoint "GET" "/api/phcs/phc-up-01" "" "Hazratganj"

# 5. 14-Day Forecast with 30-Day History
test_endpoint "GET" "/api/phcs/phc-up-01/forecast?medicine=Paracetamol" "" "forecast"

# 6. Ranked Active Alerts
test_endpoint "GET" "/api/alerts?state=UP" "" "severity"

# 7. Inventory Redistribution Recommendations
test_endpoint "GET" "/api/recommendations" "" "distanceKm"

# 8. Apply Redistribution Recommendation
test_endpoint "POST" "/api/recommendations/apply" "{}" "applied"

# 9. Trigger Disease Outbreak
test_endpoint "POST" "/api/simulate/outbreak" '{"state":"UP","medicine":"Paracetamol","multiplier":3.0}' "true"

# 10. Advance Simulation Clock
test_endpoint "POST" "/api/simulate/advance?days=3" "" "simDate"

# 11. Reset Simulation to Deterministic Seed 42
test_endpoint "POST" "/api/simulate/reset" "" "true"

# 12. 14-Day Impact Assessment
test_endpoint "GET" "/api/impact" "" "prevented"

# 13. Federated Learning Metrics
test_endpoint "GET" "/api/fl/metrics" "" "federatedMae"

# 14. Federated Model Retraining
test_endpoint "POST" "/api/fl/train" "" "roundLog"

# 15. In-Memory Compute Scale Benchmark
test_endpoint "GET" "/api/scale-test?phcs=100" "" "computeMs"

# 16. Google AI - Alert Clinical Insight
test_endpoint "POST" "/api/ai/explain-alert" '{"phcId":"phc-up-01","medicine":"Paracetamol","lang":"en"}' "summary"

# 17. Google AI - Daily Situation Briefing
test_endpoint "POST" "/api/ai/situation-brief" '{"state":"UP","lang":"en"}' "brief"

# 18. Google AI - Grounded Q&A Assistant
test_endpoint "POST" "/api/ai/ask" '{"question":"Which districts in UP will run out of insulin this week?","state":"UP","lang":"en"}' "answer"

# 19. Google AI - Multimodal Stock Update Confirmation
test_endpoint "POST" "/api/ai/ingest-register/confirm" '{"phcId":"phc-mh-01","rows":[{"medicine":"Paracetamol","quantity":450}]}' "true"

echo "=========================================="
echo " Smoke Test Complete: $PASSED / $TOTAL Passed ($FAILED Failed)"
echo "=========================================="

if [ "$FAILED" -eq 0 ]; then
    exit 0
else
    exit 1
fi
