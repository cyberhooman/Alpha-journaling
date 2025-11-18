const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

// Keep track of server port
const SERVER_PORT = 3001;
const CLIENT_PORT = 5173;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../client/public/icon.png'),
    show: false, // Don't show until ready
  });

  // Hide menu bar
  Menu.setApplicationMenu(null);

  // Load the app
  const startURL = app.isPackaged
    ? `file://${path.join(__dirname, '../client/dist/index.html')}`
    : `http://localhost:${CLIENT_PORT}`;

  mainWindow.loadURL(startURL);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    if (app.isPackaged) {
      // In production, run the built server
      const serverPath = path.join(process.resourcesPath, 'server', 'dist', 'index.js');
      serverProcess = spawn('node', [serverPath], {
        env: {
          ...process.env,
          PORT: SERVER_PORT,
          NODE_ENV: 'production',
          DATABASE_PATH: path.join(app.getPath('userData'), 'trading_journal.db'),
        },
        cwd: path.join(process.resourcesPath, 'server'),
      });
    } else {
      // In development, use ts-node
      const serverPath = path.join(__dirname, '../server/src/index.ts');
      serverProcess = spawn('npx', ['ts-node', serverPath], {
        env: {
          ...process.env,
          PORT: SERVER_PORT,
          NODE_ENV: 'development',
        },
        cwd: path.join(__dirname, '../server'),
        shell: true,
      });
    }

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
      if (data.toString().includes('Server running')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      resolve(); // Continue even if server message not received
    }, 30000);
  });
}

app.on('ready', async () => {
  try {
    // Start the backend server
    await startServer();

    // Wait a bit for server to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create the window
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // Kill server process
  if (serverProcess) {
    serverProcess.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
