# 💾 Trading Journal - Data Backup & Recovery Guide

## Your Journal Data Location

All your trading data is stored in a single SQLite database file:

```
D:\code\Michael riddering design journaling trade\server\data\trading_journal.db
```

---

## 📦 How to Backup Your Data

### Option 1: Simple Copy (Recommended for Most Users)

1. **Stop the application** (close both terminal windows)
2. **Navigate to**: `server\data\`
3. **Copy these files**:
   - `trading_journal.db` (main database)
   - `trading_journal.db-shm` (shared memory file, if exists)
   - `trading_journal.db-wal` (write-ahead log, if exists)
4. **Paste to your backup location** (USB drive, cloud storage, etc.)

### Option 2: Automated Backup Script

Create a file called `backup-journal.bat`:

```batch
@echo off
set BACKUP_DIR=%USERPROFILE%\Documents\Trading Journal Backups
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo Backing up Trading Journal...
xcopy "server\data\trading_journal.db*" "%BACKUP_DIR%\%TIMESTAMP%\" /Y /I

echo Backup completed to: %BACKUP_DIR%\%TIMESTAMP%
pause
```

Run this script weekly to keep timestamped backups.

---

## 🔄 How to Restore Your Data

### Full Restore

1. **Stop the application**
2. **Navigate to**: `server\data\`
3. **Delete or rename** the existing database files
4. **Copy your backup files** into the `server\data\` folder
5. **Start the application**

Your journal will now show all data from the backup!

---

## ☁️ Cloud Backup Options

### Using OneDrive/Google Drive

1. Create a folder in your cloud storage: "Trading Journal Backups"
2. Manually copy the database file there weekly
3. Or use a sync tool to automate this

### Using Dropbox

1. Install Dropbox
2. Create symbolic link (advanced):
   ```
   mklink /D "C:\Users\YourName\Dropbox\Trading Journal" "D:\code\Michael riddering design journaling trade\server\data"
   ```

---

## 🚨 Emergency Recovery

### If Database Gets Corrupted

SQLite with WAL mode is very robust, but if corruption occurs:

1. Stop the application
2. Check if you have `.db-wal` and `.db-shm` files
3. Try SQLite recovery:
   ```bash
   sqlite3 trading_journal.db ".recover" | sqlite3 recovered.db
   ```
4. Restore from your latest backup

---

## 📊 What's Stored in Your Database

Your SQLite database contains:

- ✅ All your trade records (entries, exits, P&L)
- ✅ Trade tags and categories
- ✅ Analytics and performance data
- ✅ User account information (encrypted passwords)
- ✅ Trading plans and journal entries
- ✅ Settings and preferences

**Everything you need is in that one file!**

---

## 🔐 Security Tips

1. **Encrypt Backups**: Store backup files in encrypted folders (BitLocker, VeraCrypt)
2. **Password Protect**: Your database contains sensitive trading data
3. **Multiple Copies**: Follow the 3-2-1 rule:
   - 3 copies of data
   - 2 different media types
   - 1 offsite backup

---

## 📅 Recommended Backup Schedule

- **Daily**: If actively trading (automated script)
- **Weekly**: For occasional traders (manual copy)
- **Monthly**: Long-term archive (cloud storage)
- **Before Updates**: Always backup before updating the app

---

## 🛠️ Advanced: Database Inspection

Want to explore your database?

1. Download **DB Browser for SQLite**: https://sqlitebrowser.org/
2. Open your `trading_journal.db` file
3. Browse your data in a visual interface
4. Run SQL queries for custom analytics

**WARNING**: Don't modify data directly unless you know SQL!

---

## 💡 Pro Tips

1. **Test Your Backups**: Occasionally try restoring from a backup to verify it works
2. **Document Your Process**: Write down where you keep backups
3. **Automate**: Set up Windows Task Scheduler to run backup script weekly
4. **Version Control**: Keep multiple backup versions (don't overwrite old backups)

---

## 📁 Backup Checklist

Before major changes or updates:

- [ ] Stop the application
- [ ] Copy `trading_journal.db`
- [ ] Copy `trading_journal.db-shm` (if exists)
- [ ] Copy `trading_journal.db-wal` (if exists)
- [ ] Label backup with date
- [ ] Store in safe location
- [ ] Test restore process
- [ ] Resume using application

---

## 🆘 Backup Troubleshooting

### "File in use" error when copying
**Solution**: Make sure the application is completely stopped (both windows closed)

### Backup file is 0 KB
**Solution**: SQLite hasn't flushed to disk. Stop app properly and wait 5 seconds before copying

### Restored backup shows old data
**Solution**: Make sure you copied all three files (.db, .db-shm, .db-wal)

---

## 🎯 Quick Reference

```
Database Location:    server\data\trading_journal.db
Recommended Frequency: Weekly
Recommended Location: External drive + cloud storage
File Size:            Starts small, grows with trades (typically < 50MB)
```

---

**Remember**: Your trading journal is valuable. Losing it means losing months or years of trading insights. Back it up regularly! 💾📊
