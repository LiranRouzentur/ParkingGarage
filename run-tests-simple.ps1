# Simple PowerShell script to run all tests

Write-Host "Starting Parking Garage Test Suite" -ForegroundColor Green

# Check if we're in the correct directory
if (-not (Test-Path "ParkingGarage.sln")) {
    Write-Host "Error: ParkingGarage.sln not found" -ForegroundColor Red
    exit 1
}

$allTestsPassed = $true

# Build the solution first
Write-Host "Building solution..." -ForegroundColor Cyan
dotnet build ParkingGarage.sln --configuration Release
if ($LASTEXITCODE -ne 0) {
    $allTestsPassed = $false
}

# Run backend tests
if ($allTestsPassed) {
    Write-Host "Running Backend Tests..." -ForegroundColor Cyan
    dotnet test server/ParkingGarage.Api.Tests/ParkingGarage.Api.Tests.csproj --configuration Release
    if ($LASTEXITCODE -ne 0) {
        $allTestsPassed = $false
    }
}

# Run frontend tests
if ($allTestsPassed -and (Test-Path "client")) {
    Write-Host "Running Frontend Tests..." -ForegroundColor Cyan
    Push-Location "client"
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    npm test -- --coverage --watchAll=false
    if ($LASTEXITCODE -ne 0) {
        $allTestsPassed = $false
    }
    
    Pop-Location
}

# Summary
if ($allTestsPassed) {
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SOME TESTS FAILED!" -ForegroundColor Red
    exit 1
}
