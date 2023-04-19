const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 350,
    height: 500,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("app/index.html");
  win.setResizable(false);
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("submit-form", (event, rewFilter, zapcoEqFile, channel) => {
  console.log("submit form!");

  let rewFilterContent = fs.readFileSync(rewFilter, {
    encoding: "utf-8",
    flag: "r",
  });

  let zapcoEqContent = fs.readFileSync(zapcoEqFile, {
    encoding: "utf-8",
    flag: "r",
  });
  
  // ... generate the new eq file here

  // save / send via http download?
});
