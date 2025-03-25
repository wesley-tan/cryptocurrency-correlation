# Crypto Token Correlation Analyzer

A full-stack application that analyzes the correlation between different cryptocurrency tokens using real-time and historical price data from the CoinGecko API.

## Features

- Select any two cryptocurrency tokens for comparison
- Choose different time periods for analysis (7, 14, 30, 90, 180 days, or 1 year)
- View the Pearson correlation coefficient between token price movements
- Visual interpretation of correlation strength (strong positive to strong negative)

## Tech Stack

- **Frontend**: React, Chart.js
- **Backend**: Node.js, Express
- **API**: CoinGecko API for cryptocurrency price data

## Project Structure

```
crypto-correlation/
├── client/               # React frontend
│   ├── public/
│   └── src/
│       ├── App.js        # Main application component
│       └── ...
├── server/               # Node.js backend
│   ├── index.js          # Express server and API endpoints
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v12 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd crypto-correlation
   ```

2. Install server dependencies:
   ```
   cd server
   npm install
   ```

3. Install client dependencies:
   ```
   cd ../client
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd server
   npm run dev
   ```

2. In a separate terminal, start the frontend:
   ```
   cd client
   npm start
   ```

3. Access the application at `http://localhost:3000`

## API Endpoints

- **GET `/api/correlation`**: Get correlation between two tokens
  - Query parameters: 
    - `token1`: First token ID (e.g., 'bitcoin')
    - `token2`: Second token ID (e.g., 'ethereum')
    - `days`: Time period in days (default: 30)

## Future Improvements

- Add interactive charts to visualize price movements
- Implement token search with suggestions
- Add historical correlation trends
- Create user accounts to save favorite token pairs
- Add more detailed statistical analysis
