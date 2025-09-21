# PowerShell script to start both backend and frontend in development mode

Write-Host "Starting Parking Garage Management System..." -ForegroundColor Green

# Start backend in background
Write-Host "Starting .NET API backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd server/ParkingGarage.Api; dotnet watch run" -WindowStyle Minimized

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting React frontend..." -ForegroundColor Yellow
Set-Location client
npm start

Write-Host "Both services are starting up..." -ForegroundColor Green
Write-Host "Backend API: https://localhost:7000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API Documentation: https://localhost:7000/swagger" -ForegroundColor Cyan
