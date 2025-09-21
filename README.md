# 🅿️ Parking Garage Management System

A full-stack web application for managing vehicle check-in/check-out operations in a parking garage with 60 parking lots. The system enforces ticket type restrictions, vehicle dimension validation, and provides real-time garage state monitoring.

## 🏗️ Architecture

- **Frontend**: React 19 with TypeScript, Material-UI, Tailwind CSS
- **Backend**: .NET 9 Web API with Entity Framework Core
- **Database**: SQL Server LocalDB with MDF file storage
- **Testing**: Comprehensive unit and integration tests (113 tests total)

## 📋 Prerequisites

### Required Software

#### For Windows:

```powershell
# Install .NET 9 SDK
winget install Microsoft.DotNet.SDK.9

# Install Node.js 18+ (LTS recommended)
winget install OpenJS.NodeJS

# Install SQL Server LocalDB (usually comes with Visual Studio)
winget install Microsoft.SQLServer.LocalDB
```

#### For macOS:

```bash
# Install .NET 9 SDK
brew install --cask dotnet-sdk

# Install Node.js 18+ (LTS recommended)
brew install node

# Install SQLite (included with macOS)
# No additional installation needed
```

#### For Linux (Ubuntu/Debian):

```bash
# Install .NET 9 SDK
wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y dotnet-sdk-9.0

# Install Node.js 18+ (LTS recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install SQLite
sudo apt-get install -y sqlite3
```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd ParkingGarage
```

### 2. Install Dependencies

#### Backend Dependencies

```bash
cd server/ParkingGarage.Api
dotnet restore
```

#### Frontend Dependencies

```bash
cd client
npm install
```

### 3. Run the Application

#### Option A: Automated Start (Recommended)

```powershell
# Windows
.\start-dev.ps1
```

```bash
# Linux/macOS
./start-dev.sh
```

#### Option B: Manual Start

**Terminal 1 - Backend:**

```bash
cd server/ParkingGarage.Api
dotnet watch run
```

**Terminal 2 - Frontend:**

```bash
cd client
npm start
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: https://localhost:7000
- **API Documentation**: https://localhost:7000/swagger

## 🧪 Running Tests

### All Tests

```powershell
# Windows
.\run-tests.ps1
```

```bash
# Linux/macOS
./run-tests.sh
```

### Individual Test Suites

#### Backend Tests

```bash
cd server/ParkingGarage.Api.Tests
dotnet test
```

#### Frontend Tests

```bash
cd client
npm test -- --coverage --watchAll=false
```
