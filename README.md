# 📊 Trading Journal Pro

> A professional trading journal application similar to Tradezella, built with React, TypeScript, Node.js, Express, and SQLite. Track, analyze, and improve your trading performance with advanced analytics and insights.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows-brightgreen)
![Database](https://img.shields.io/badge/database-SQLite-orange)

---

## 🚀 Quick Start (Double-Click to Launch!)

### First Time Setup

1. **Create Desktop Shortcut** → Double-click `create-shortcut.vbs`
2. **Launch App** → Double-click the "Trading Journal Pro" shortcut on your desktop
3. **Start Trading!** → Browser opens automatically at http://localhost:3001

📖 **Need help?** See [QUICK-START.md](QUICK-START.md) for detailed instructions
💾 **Backup guide**: See [BACKUP-GUIDE.md](BACKUP-GUIDE.md) for data safety

---

## 💾 Your Data is Safe

✅ **All data stored locally** at: `server\data\trading_journal.db`
✅ **No internet required** - runs completely offline
✅ **Your journal will never be lost** - backed up on your PC
✅ **Easy backup** - just copy one database file

---

## Features

### Core Features
- **Trade Management**
  - Add, edit, and delete trades
  - Support for LONG and SHORT positions
  - Track entry/exit prices, stop loss, and take profit levels
  - Automatic P&L calculations
  - Trade status tracking (Open, Closed, Cancelled)

- **Advanced Analytics**
  - Real-time dashboard with key performance metrics
  - Win rate, profit factor, expectancy calculations
  - P&L charts over time
  - Performance breakdown by symbol, strategy, and setup
  - Win rate analysis by day of week
  - Consecutive win/loss streaks tracking

- **Trading Calendar**
  - Visual calendar view of trading activity
  - Daily P&L and trade count
  - Win/loss ratio per day

- **Tags & Organization**
  - Custom trade tags with colors
  - Tag-based filtering and analysis
  - Notes, entry reasoning, exit reasoning fields
  - Strategy and setup categorization

- **Data Import**
  - CSV import functionality for broker data
  - CSV template download
  - Bulk trade import with error reporting

- **User Authentication**
  - Secure JWT-based authentication
  - User registration and login
  - Protected routes and API endpoints

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Router for navigation
- TanStack Query for data fetching
- Recharts for data visualization
- Zustand for state management
- date-fns for date handling

### Backend
- Node.js with Express
- TypeScript
- **SQLite database** (local, no setup required!)
- JWT for authentication
- Bcrypt for password hashing
- Zod for validation
- CSV parsing support

## Prerequisites

- Node.js 18+ and npm (that's it!)
- No database server required
- No complex setup needed

## 🎯 Installation & Running

### Option 1: Easy Launch (Recommended)

1. Double-click `create-shortcut.vbs` to create a desktop shortcut
2. Double-click the desktop shortcut to launch
3. Done! App opens in your browser

### Option 2: Command Line

```bash
# Install dependencies (first time only)
npm install

# Start the app
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:5000

### Manual Installation

If the automated script doesn't install dependencies:

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..

# Run the app
npm run dev
```

## Project Structure

```
trading-journal-pro/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # API client and utilities
│   │   ├── store/          # Zustand stores
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── index.html
│   └── package.json
│
├── server/                  # Node.js backend
│   ├── src/
│   │   ├── db/             # Database configuration
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── index.ts        # Server entry point
│   └── package.json
│
├── package.json            # Root package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Trades
- `GET /api/trades` - Get all trades (with filters)
- `GET /api/trades/:id` - Get single trade
- `POST /api/trades` - Create new trade
- `PUT /api/trades/:id` - Update trade
- `DELETE /api/trades/:id` - Delete trade

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics
- `GET /api/analytics/calendar` - Get calendar data
- `GET /api/analytics/performance` - Get performance metrics

### Tags
- `GET /api/tags` - Get all tags
- `POST /api/tags` - Create tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Import
- `POST /api/import/csv` - Import trades from CSV
- `GET /api/import/csv/template` - Download CSV template

## Usage Guide

### Adding a Trade

1. Click "New Trade" button
2. Fill in required fields:
   - Symbol (e.g., AAPL, TSLA)
   - Side (Long or Short)
   - Entry Date and Price
   - Quantity
3. Optional fields:
   - Exit Date and Price
   - Stop Loss / Take Profit
   - Strategy, Setup, Timeframe
   - Notes and reasoning
4. Click "Create Trade"

### Importing Trades

1. Go to Import page
2. Download the CSV template
3. Fill in your trade data
4. Upload the CSV file
5. Review import results

### Viewing Analytics

1. Dashboard - Overview of all performance metrics
2. Analytics - Deep dive into strategies, setups, and patterns
3. Calendar - Day-by-day trading activity

## CSV Import Format

Required columns:
- Symbol
- Side (LONG, SHORT, BUY, or SELL)
- Entry Date (ISO format: 2024-01-15T10:30:00Z)
- Entry Price
- Quantity

Optional columns:
- Exit Date, Exit Price
- Stop Loss, Take Profit
- Fees, Strategy, Notes

Example:
```csv
Symbol,Side,Entry Date,Exit Date,Entry Price,Exit Price,Quantity,Fees,Strategy
AAPL,LONG,2024-01-15T10:30:00Z,2024-01-15T14:30:00Z,150.50,152.75,10,2.50,Breakout
```

## Key Metrics Explained

- **Win Rate**: Percentage of winning trades
- **Profit Factor**: Ratio of gross profit to gross loss
- **Expectancy**: Average amount you can expect to win per trade
- **R-Multiple**: Risk-reward ratio
- **Max Drawdown**: Largest peak-to-trough decline

## Security Features

- Passwords hashed with bcrypt
- JWT token-based authentication
- SQL injection protection via parameterized queries
- CORS configuration
- Input validation with Zod

## Contributing

This is a personal project template. Feel free to fork and customize for your needs.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions, please create an issue in the repository.

## Roadmap

Future enhancements:
- [ ] Broker integrations (MetaTrader, Interactive Brokers)
- [ ] Trade replay functionality
- [ ] Screenshot uploads for trades
- [ ] Mobile app
- [ ] Advanced backtesting
- [ ] AI-powered trade insights
- [ ] Risk management tools
- [ ] Multi-account support
- [ ] Export reports to PDF

---

Built with ❤️ by Michael Riddering - Pro Designer & Developer
