# Parking Garage Management System - Product Requirements Document (PRD)

## **System Overview**

The Parking Garage Management System is a full-stack web application that manages vehicle check-in/check-out operations for a parking garage with 60 parking lots. The system enforces ticket type restrictions, vehicle dimension validation, and provides real-time garage state monitoring.

## **Architecture**

- **Frontend**: React 18 with TypeScript, Material-UI, Tailwind CSS
- **Backend**: .NET 9 Web API with Entity Framework Core
- **Database**: SQL Server LocalDB with MDF file storage
- **Deployment**: Local development environment

## **Core Business Rules**

### **Vehicle Classification System**

```
Class A: Motorcycle, Private, Crossover
Class B: SUV, Van
Class C: Truck
```

### **Ticket Types & Pricing**

| Ticket Type | Lots  | Dimensions (H×W×L) | Classes       | Cost | Time Limit |
| ----------- | ----- | ------------------ | ------------- | ---- | ---------- |
| VIP         | 1-10  | No limit           | All (A, B, C) | $200 | No limit   |
| Value       | 11-30 | 2500×2400×5000mm   | A, B          | $100 | 72 hours   |
| Regular     | 31-60 | 2000×2000×3000mm   | A only        | $50  | 24 hours   |

## **API Endpoints**

### **Core Operations**

- `GET /api/parking/garage-state` - Get current garage state with optional filtering
- `POST /api/parking/checkin` - Check in a single vehicle
- `POST /api/parking/checkout` - Check out a vehicle by license plate
- `POST /api/parking/checkin-with-upgrade` - Check in with ticket upgrade
- `POST /api/parking/async-checkin` - Check in 1-5 random vehicles asynchronously
- `GET /api/parking/generate-fake-data` - Generate fake data for available ticket types

### **Response Structure**

All endpoints return flattened responses with:

- `statistics`: Garage statistics (total, available, occupied lots, etc.)
- `updatedLot`: Single lot update (for single operations)
- `updatedLots`: Multiple lot updates (for async operations)

## **Database Schema**

### **ParkingLots Table**

```sql
Id (int, PK, Identity)
LotNumber (int, UNIQUE, NOT NULL)
TicketType (int, NOT NULL) -- 1=VIP, 2=Value, 3=Regular
Status (int, NOT NULL) -- 1=Available, 2=Occupied
VehicleId (int, NULL, FK)
```

### **ParkedVehicles Table**

```sql
Id (int, PK, Identity)
Name (nvarchar(100), NOT NULL)
LicensePlate (nvarchar(20), UNIQUE, NOT NULL)
Phone (nvarchar(20), NOT NULL)
TicketType (int, NOT NULL)
VehicleType (int, NOT NULL) -- 1=Motorcycle, 2=Private, etc.
Height (decimal(5,2), NOT NULL)
Width (decimal(5,2), NOT NULL)
Length (decimal(5,2), NOT NULL)
LotNumber (int, NOT NULL)
CheckInTime (datetime2, NOT NULL)
CheckOutTime (datetime2, NULL)
TotalCost (decimal(10,2), NULL)
```

## **Key Features**

### **1. Vehicle Check-In Process**

- **Input Validation**: Name, License Plate, Phone, Ticket Type, Vehicle Type, Dimensions
- **Dimension Validation**: Server-side validation against ticket type limits
- **Upgrade Logic**: If vehicle doesn't meet ticket criteria, suggest suitable upgrade with cost difference
- **Lot Assignment**: Automatic assignment of available lot based on ticket type
- **Real-time Updates**: UI updates immediately after successful check-in

### **2. Vehicle Check-Out Process**

- **License Plate Lookup**: Find vehicle by license plate ID
- **Cost Calculation**: Calculate total cost based on ticket type and duration
- **Lot Release**: Mark lot as available and update vehicle record
- **Time Tracking**: Display check-in/check-out times and duration

### **3. Async Check-In (Random Vehicles)**

- **Random Generation**: Create 1-5 vehicles with realistic random data
- **Concurrent Processing**: Handle multiple check-ins simultaneously
- **Availability Check**: Ensure sufficient lots available before processing
- **Results Display**: Show success/failure for each vehicle attempt
- **Batch Updates**: Update UI with all results at once

### **4. Garage State Management**

- **Real-time Display**: Show all 60 lots with current status
- **Filtering**: Filter by ticket type and status (Available/Occupied)
- **Statistics**: Display total, available, and occupied lot counts
- **KPI Cards**: Visual indicators for garage capacity and availability

### **5. UI Features**

- **Responsive Design**: Works on desktop and mobile devices
- **Material-UI Components**: Modern, accessible interface
- **Toast Notifications**: Success/error feedback for all operations
- **Form Validation**: Client-side and server-side validation
- **Loading States**: Visual feedback during API operations
- **Fake Data Generation**: Quick testing with realistic data

## **Technical Implementation Details**

### **Frontend Architecture**

- **React Hooks**: useState, useEffect, useCallback for state management
- **Context API**: Toast notifications and theme management
- **TypeScript**: Full type safety for all components and API calls
- **Material-UI**: Consistent design system with custom theming
- **API Service**: Centralized HTTP client with error handling

### **Backend Architecture**

- **Clean Architecture**: Controllers → Services → Data Access
- **Entity Framework Core**: Code-first approach with migrations
- **Dependency Injection**: Service registration and lifetime management
- **Async/Await**: Non-blocking operations throughout
- **Logging**: Structured logging with Serilog to file
- **Stored Procedures**: Server-side filtering and data retrieval

### **Database Features**

- **LocalDB**: Local SQL Server instance with MDF file
- **Migrations**: Version-controlled schema changes
- **Stored Procedures**: Optimized queries for filtering and statistics
- **Constraints**: Data integrity with foreign keys and unique constraints
- **Indexing**: Optimized queries for lot lookups and vehicle searches

## **Error Handling**

### **Client-Side**

- Form validation with real-time feedback
- API error handling with user-friendly messages
- Network error recovery and retry logic
- Loading states to prevent double submissions

### **Server-Side**

- Try-catch blocks around all operations
- Structured error responses with meaningful messages
- Logging of all errors and warnings
- Graceful degradation for database issues

## **Security Considerations**

- **Input Sanitization**: All user inputs are validated and sanitized
- **SQL Injection Prevention**: Parameterized queries and EF Core
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Data Validation**: Both client and server-side validation

## **Performance Optimizations**

- **Minimal API Responses**: Only return necessary data
- **Efficient Queries**: Stored procedures for complex operations
- **Caching**: Client-side state management to reduce API calls
- **Async Operations**: Non-blocking I/O throughout the system
- **Database Indexing**: Optimized queries for common operations

## **Testing & Quality Assurance**

### **Current Status**

- ✅ All core functionality working
- ✅ UI/UX polished and responsive
- ✅ Error handling comprehensive
- ✅ Data validation complete
- ✅ Async operations functional
- ✅ Database operations stable

### **Future Enhancements**

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing under load
- Security penetration testing

## **Deployment & Maintenance**

### **Local Development**

- **Server**: `dotnet run` from `server/ParkingGarage.Api`
- **Client**: `npm start` from `client` directory
- **Database**: Automatic creation with LocalDB
- **Logs**: Available in `server/ParkingGarage.Api/logs/`

### **File Structure**

```
ParkingGarage/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Utility functions
├── server/
│   └── ParkingGarage.Api/  # .NET Web API
│       ├── Controllers/    # API endpoints
│       ├── Services/       # Business logic
│       ├── Entities/       # Database models
│       ├── Data/           # EF Core context
│       └── Migrations/     # Database schema
└── ParkingGarage.sln      # Solution file
```

## **Known Issues & Limitations**

1. **No Authentication**: System assumes single-user environment
2. **No Data Persistence**: Database resets on application restart
3. **No Backup System**: No automated backup of parking data
4. **No Reporting**: No historical reports or analytics
5. **No Payment Processing**: Cost calculation only, no actual payment

## **Future Roadmap**

### **Phase 1: Core Enhancements**

- User authentication and authorization
- Data persistence across restarts
- Backup and restore functionality
- Enhanced reporting and analytics

### **Phase 2: Advanced Features**

- Payment processing integration
- Mobile app development
- Real-time notifications
- Advanced search and filtering

### **Phase 3: Enterprise Features**

- Multi-garage support
- Role-based access control
- Audit logging
- API rate limiting

## **Support & Maintenance**

### **Log Files**

- Location: `server/ParkingGarage.Api/logs/parking-garage.txt`
- Rotation: Daily with 7-day retention
- Level: Information, Warning, Error

### **Database Maintenance**

- Automatic migration on startup
- Manual migration: `dotnet ef database update`
- Backup: Copy MDF file from `App_Data` directory

### **Troubleshooting**

1. Check log files for errors
2. Verify LocalDB is running
3. Ensure all dependencies are installed
4. Check database connection string
5. Verify port availability (5034 for API, 3000 for client)

---

**Document Version**: 1.0  
**Last Updated**: September 19, 2025  
**Maintained By**: Development Team  
**Status**: Production Ready
