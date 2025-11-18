# Trading Journal Pro - Desktop Application

## Installation Complete! 🎉

Your Trading Journal Pro desktop application is now installed and ready to use!

## How to Launch

You can start the application in two ways:

1. **Desktop Shortcut**: Double-click the "Trading Journal Pro" shortcut on your desktop
2. **Start Menu**: Search for "Trading Journal Pro" in the Windows Start Menu

## Features

- ✅ **Fully Offline**: Works without internet connection
- ✅ **Native Desktop App**: Runs as a standalone Windows application
- ✅ **All Data Stored Locally**: Your trading data is stored on your PC in SQLite database
- ✅ **Fast Performance**: No browser overhead
- ✅ **Auto-Start**: Server automatically starts when you launch the app

## Data Location

Your trading data is stored at:
```
d:\code\Michael riddering design journaling trade\server\data\trading_journal.db
```

**Important**: Backup this file regularly to protect your trading journal data!

## Troubleshooting

### App Won't Start
1. Make sure Node.js is installed
2. Open Command Prompt and navigate to: `d:\code\Michael riddering design journaling trade`
3. Run: `npm install` to ensure all dependencies are installed

### Need to Rebuild
If you make changes to the code:
```bash
cd "d:\code\Michael riddering design journaling trade"
npm run build
```

## Development Mode

To run in development mode with hot-reload:
```bash
cd "d:\code\Michael riddering design journaling trade"
npm run electron:dev
```

## Uninstallation

To remove the app:
1. Delete the desktop shortcut
2. Optionally delete the folder: `d:\code\Michael riddering design journaling trade`

## Support

For issues or questions, refer to the main README.md file or check the GitHub repository.

---

**Enjoy your offline Trading Journal Pro application!** 📊📈
