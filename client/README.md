# Parking Garage Management - React Frontend

A modern React frontend for the Parking Garage Management System, built with TypeScript, Tailwind CSS, and React Query.

## Features

- **Dashboard**: Overview of parking spots, reservations, and quick actions
- **Parking Spots**: View and manage all parking spots with real-time status
- **Vehicles**: Register and manage vehicles with license plate validation
- **Reservations**: Create, start, complete, and cancel parking reservations
- **Payments**: Track payment transactions and their status

## Technology Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **React Query** for state management and API calls
- **Tailwind CSS** for styling
- **React Hook Form** with Yup validation
- **Heroicons** for icons
- **Axios** for HTTP requests

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Backend API running on https://localhost:7000

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run lint` - Runs ESLint
- `npm run lint:fix` - Fixes ESLint errors automatically

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.tsx      # Main layout with navigation
├── pages/              # Page components
│   ├── Dashboard.tsx   # Dashboard overview
│   ├── ParkingSpots.tsx # Parking spots management
│   ├── Vehicles.tsx    # Vehicle registration
│   ├── Reservations.tsx # Reservation management
│   └── Payments.tsx    # Payment tracking
├── services/           # API services
│   └── api.ts         # API client and endpoints
├── types/              # TypeScript type definitions
│   └── index.ts       # Shared types and interfaces
├── App.tsx            # Main app component
└── index.tsx          # App entry point
```

## API Integration

The frontend communicates with the .NET backend API through the following endpoints:

- **Parking Spots**: `/api/parkingspots`
- **Vehicles**: `/api/vehicles`
- **Reservations**: `/api/reservations`
- **Payments**: `/api/payments`

## Environment Variables

Create a `.env.local` file in the root directory:

```env
REACT_APP_API_URL=https://localhost:7000/api
```

## Features Overview

### Dashboard

- Real-time statistics of parking spots
- Quick action buttons
- Recent activity overview

### Parking Spots

- Grid view of all parking spots
- Filter by vehicle type
- Real-time status indicators
- Spot details and pricing

### Vehicles

- Vehicle registration form with validation
- Search functionality
- Vehicle type categorization
- License plate validation

### Reservations

- Create new reservations
- Start/complete/cancel reservations
- Status tracking and filtering
- Time and cost information

### Payments

- Payment processing
- Transaction tracking
- Status filtering
- Payment method support

## Styling

The app uses Tailwind CSS with custom component classes defined in `src/index.css`. The design system includes:

- Primary color scheme (blue)
- Success, warning, and danger colors
- Consistent button and form styles
- Responsive grid layouts
- Dark/light mode support ready

## Development

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- React Hook Form for form management
- Yup for validation schemas

### State Management

- React Query for server state
- React hooks for local state
- Optimistic updates for better UX
- Error handling and loading states

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
