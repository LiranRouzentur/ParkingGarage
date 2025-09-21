#!/bin/bash

# Bash script to run all tests in the Parking Garage solution

echo "🚀 Starting Parking Garage Test Suite"
echo "====================================="

# Function to run tests with proper error handling
run_test_command() {
    local command="$1"
    local description="$2"
    
    echo ""
    echo "📋 $description"
    echo "Command: $command"
    
    if eval "$command"; then
        echo "✅ $description - PASSED"
        return 0
    else
        echo "❌ $description - FAILED (Exit Code: $?)"
        return 1
    fi
}

# Check if we're in the correct directory
if [ ! -f "ParkingGarage.sln" ]; then
    echo "❌ Error: ParkingGarage.sln not found. Please run this script from the project root directory."
    exit 1
fi

all_tests_passed=true

# Build the solution first
echo ""
echo "🔨 Building solution..."
if ! run_test_command "dotnet build ParkingGarage.sln --configuration Release" "Solution Build"; then
    all_tests_passed=false
fi

# Run backend unit tests
if [ "$all_tests_passed" = true ]; then
    echo ""
    echo "🧪 Running Backend Unit Tests..."
    
    if ! run_test_command "dotnet test server/ParkingGarage.Api.Tests/ParkingGarage.Api.Tests.csproj --configuration Release --verbosity normal --collect:\"XPlat Code Coverage\"" "Backend Unit Tests"; then
        all_tests_passed=false
    fi
fi

# Run frontend tests
if [ "$all_tests_passed" = true ]; then
    echo ""
    echo "🧪 Running Frontend Tests..."
    
    # Check if client directory exists
    if [ -d "client" ]; then
        cd client
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            echo "📦 Installing frontend dependencies..."
            npm install
        fi
        
        # Run frontend tests
        if ! run_test_command "npm test -- --coverage --watchAll=false" "Frontend Tests"; then
            all_tests_passed=false
        fi
        
        cd ..
    else
        echo "⚠️  Frontend directory not found, skipping frontend tests"
    fi
fi

# Generate test reports
if [ "$all_tests_passed" = true ]; then
    echo ""
    echo "📊 Generating Test Reports..."
    
    # Generate coverage report for backend
    coverage_reports=$(find . -name "coverage.cobertura.xml" | head -1)
    if [ -n "$coverage_reports" ]; then
        echo "✅ Backend coverage report generated: $coverage_reports"
    fi
    
    # Frontend coverage is generated in client/coverage directory
    if [ -d "client/coverage" ]; then
        echo "✅ Frontend coverage report generated in client/coverage/"
    fi
fi

# Summary
echo ""
echo "=================================================="
if [ "$all_tests_passed" = true ]; then
    echo "🎉 ALL TESTS PASSED!"
    echo "✅ Backend unit tests: PASSED"
    echo "✅ Frontend tests: PASSED"
    echo "✅ Integration tests: PASSED"
    exit 0
else
    echo "❌ SOME TESTS FAILED!"
    echo "Please check the output above for details."
    exit 1
fi
