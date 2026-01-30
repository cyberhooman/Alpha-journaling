# Trading Journal Pro - Quick Start Guide

## Welcome to Your Personal Trading Analytics Platform! 📊

Your trading journal is now set up to run completely locally on your PC with persistent data storage.

---

## 🚀 Quick Start (3 Easy Steps)

### Step 1: Create Desktop Shortcut (One-Time Setup)
Double-click `create-shortcut.vbs` in this folder to create a desktop shortcut.

### Step 2: Launch the App
Double-click the **"Trading Journal Pro"** shortcut on your desktop.

### Step 3: Access in Browser
Your browser will automatically open to `http://localhost:3001`

That's it! Your app is running! 🎉

---

## 📂 Your Data Location

All your trading journal data is stored locally at:
```
D:\code\Michael riddering design journaling trade\server\data\trading_journal.db
```

### Data Safety Features:
- ✅ All data stored locally on your PC
- ✅ SQLite database with WAL (Write-Ahead Logging) for reliability
- ✅ Automatic foreign key constraints to maintain data integrity
- ✅ No internet connection required for the app to work

---

## 🔐 First Time Login

### Option 1: Create Your Account
1. Click "Sign Up" on the login page
2. Enter your email and password
3. Start journaling your trades!

### Option 2: Use Demo Account (for testing)
- Email: `demo@example.com`
- Password: `demo123`

---

## 💾 Backup Your Data

To backup your trading journal:

1. **Simple Backup**: Copy this file to a safe location:
   ```
   server\data\trading_journal.db
   ```

2. **Complete Backup**: Copy these additional files (created during use):
   ```
   server\data\trading_journal.db-shm
   server\data\trading_journal.db-wal
   ```

3. **Restore**: Simply copy these files back to the same location

---

## 🛠️ Manual Start (Alternative Methods)

### Method 1: Batch File (Easiest)
Double-click `start-trading-journal.bat`

### Method 2: PowerShell (Modern)
Right-click `start-trading-journal.ps1` → Run with PowerShell

### Method 3: Command Line (Advanced)
```bash
npm run dev
```

---

## 🌐 Application URLs

- **Frontend (Your App)**: http://localhost:3001
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## 🛑 How to Stop the Application

Close the two terminal windows that opened:
1. "Trading Journal - Backend Server"
2. "Trading Journal - Frontend Client"

---

## 📊 Features Overview

### Trade Management
- ✅ Track LONG and SHORT positions
- ✅ Multiple asset types (Stocks, Forex, Crypto, Futures, Options)
- ✅ Automatic P&L calculations
- ✅ Entry/exit price tracking with stop loss and take profit

### Analytics Dashboard
- ✅ Real-time performance metrics
- ✅ Win rate and profit factor analysis
- ✅ Daily, weekly, monthly breakdowns
- ✅ Strategy performance comparison
- ✅ Trade calendar visualization

### Advanced Features
- ✅ Custom tags with color coding
- ✅ Trade screenshots and notes
- ✅ Emotional state tracking
- ✅ CSV import/export
- ✅ Multi-account support (Live, Demo, Prop Firm)
- ✅ Trading plans and daily journals

---

## 🆘 Troubleshooting

### App Won't Start
**Issue**: "Node.js is not installed" error
**Solution**: Install Node.js from https://nodejs.org/ (choose LTS version)

### Port Already in Use
**Issue**: Error says port 3001 or 5000 is already in use
**Solution**:
1. Close any other instances of the app
2. Or change ports in `server\.env` and `client\vite.config.ts`

### Data Not Saving
**Issue**: Changes disappear after restart
**Solution**:
1. Check that `server\data\` folder exists
2. Verify file permissions (folder should be writable)
3. Check console for database errors

### Browser Doesn't Open
**Issue**: App starts but browser doesn't open
**Solution**: Manually open http://localhost:3001 in your browser

---

## 🔄 Updating the App

1. Stop the application (close terminal windows)
2. Pull latest changes (if using Git)
3. Run: `npm install` in root, client, and server folders
4. Restart the app

Your database file will be preserved during updates!

---

## 📝 System Requirements

- **OS**: Windows 10/11 (Scripts optimized for Windows)
- **Node.js**: v18 or higher
- **RAM**: 2GB minimum
- **Storage**: ~500MB for application + database
- **Browser**: Chrome, Firefox, Edge, or Safari

---

## 🎯 Project Structure

```
trading-journal-pro/
├── client/              # React frontend
├── server/              # Express backend
│   └── data/           # YOUR JOURNAL DATA IS HERE
│       └── trading_journal.db
├── start-trading-journal.bat     # Windows launcher
├── start-trading-journal.ps1     # PowerShell launcher
├── create-shortcut.vbs           # Desktop shortcut creator
└── QUICK-START.md               # This file
```

---

## 💡 Tips for Best Experience

1. **Regular Backups**: Copy your database file weekly to a backup location
2. **Use Tags**: Organize trades with custom tags for better analysis
3. **Add Screenshots**: Visual records help you remember trade setups
4. **Write Notes**: Document your reasoning - future you will thank you!
5. **Review Analytics**: Check your performance metrics regularly
6. **Set Trading Plans**: Create and follow your trading strategy

---

## 🤝 Support

- Check the console windows for error messages
- Database file location is always shown when server starts
- All data is stored locally - no external dependencies

---

## 🎨 Built By

**Michael Riddering** - Professional Designer & Developer

---

**Happy Trading! 📈**

Remember: The best traders are the ones who learn from every trade.
This journal is your tool to become better every day.
