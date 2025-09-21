#!/bin/bash

# Bash script to start both backend and frontend in development mode

echo "Starting Parking Garage Management System..."

# Start backend in background
echo "Starting .NET API backend..."
cd server/ParkingGarage.Api
dotnet watch run &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting React frontend..."
cd ../../client
npm start &
FRONTEND_PID=$!

echo "Both services are starting up..."
echo "Backend API: https://localhost:7000"
echo "Frontend: http://localhost:3000"
echo "API Documentation: https://localhost:7000/swagger"

# Wait for user to stop
echo "Press Ctrl+C to stop both services"
wait
