# SahaMatrix PowerShell Smoke Test Suite
$port = if ($env:PORT) { $env:PORT } else { "8081" }
$baseUrl = "http://localhost:$port"
$total = 0
$passed = 0
$failed = 0

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Running SahaMatrix API Smoke Tests on $baseUrl" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

function Test-Endpoint($method, $path, $body, $expectedSubstr) {
    $script:total++
    try {
        if ($method -eq "GET") {
            $resp = Invoke-RestMethod -Uri "$baseUrl$path" -Method Get
        } else {
            $resp = Invoke-RestMethod -Uri "$baseUrl$path" -Method Post -ContentType "application/json" -Body $body
        }
        $jsonStr = $resp | ConvertTo-Json -Depth 5 -Compress
        if ($jsonStr -match $expectedSubstr) {
            Write-Host "[PASS] $method $path" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "[FAIL] $method $path (Substring '$expectedSubstr' not matched)" -ForegroundColor Red
            $script:failed++
        }
    } catch {
        Write-Host "[FAIL] $method $path ($($_.Exception.Message))" -ForegroundColor Red
        $script:failed++
    }
}

Test-Endpoint "GET" "/api/health" "" "UP"
Test-Endpoint "POST" "/api/simulate/reset" "" "true"
Test-Endpoint "GET" "/api/summary" "" "simDate"
Test-Endpoint "GET" "/api/phcs?state=MH" "" "phc-mh"
Test-Endpoint "GET" "/api/phcs/phc-up-01" "" "Hazratganj"
Test-Endpoint "GET" "/api/phcs/phc-up-01/forecast?medicine=Paracetamol" "" "forecast"
Test-Endpoint "GET" "/api/alerts?state=UP" "" "severity"
Test-Endpoint "GET" "/api/recommendations" "" "distanceKm"
Test-Endpoint "POST" "/api/recommendations/apply" "{}" "applied"
Test-Endpoint "POST" "/api/simulate/outbreak" '{"state":"UP","medicine":"Paracetamol","multiplier":3.0}' "true"
Test-Endpoint "POST" "/api/simulate/advance?days=3" "" "simDate"
Test-Endpoint "POST" "/api/simulate/reset" "" "true"
Test-Endpoint "GET" "/api/impact" "" "prevented"
Test-Endpoint "GET" "/api/fl/metrics" "" "federatedMae"
Test-Endpoint "POST" "/api/fl/train" "" "roundLog"
Test-Endpoint "GET" "/api/scale-test?phcs=100" "" "computeMs"
Test-Endpoint "POST" "/api/ai/explain-alert" '{"phcId":"phc-up-01","medicine":"Paracetamol","lang":"en"}' "summary"
Test-Endpoint "POST" "/api/ai/situation-brief" '{"state":"UP","lang":"en"}' "brief"
Test-Endpoint "POST" "/api/ai/ask" '{"question":"Which districts in UP will run out of insulin this week?","state":"UP","lang":"en"}' "answer"
Test-Endpoint "POST" "/api/ai/ingest-register/confirm" '{"phcId":"phc-mh-01","rows":[{"medicine":"Paracetamol","quantity":450}]}' "true"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Smoke Test Complete: $passed / $total Passed ($failed Failed)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if ($failed -gt 0) { exit 1 } else { exit 0 }
