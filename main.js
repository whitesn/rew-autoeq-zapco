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
  let rewFilterContent = fs.readFileSync(rewFilter, {
    encoding: "utf-8",
    flag: "r",
  });

  let zapcoEqContent = fs.readFileSync(zapcoEqFile, {
    encoding: "utf-8",
    flag: "r",
  });

  let parsedRewFilter = parseRewFilter(rewFilterContent);
  let parsedZapcoEq = JSON.parse(zapcoEqContent);

  // Reset and clean the channel data, then apply filter
  let defaultChData = fs.readFileSync("./examples/defaultZapcoChData.txt");
  defaultChData = JSON.parse(defaultChData);
  parsedZapcoEq["Channle" + channel]["stID"] = defaultChData;

  // Channle<1-8>.stID.id<1-15>
  // [<id>, <freq>, <q>, <gain>]
  for (let i = 0; i < parsedRewFilter.length; i++) {
    let id = i+1;

    parsedZapcoEq["Channle" + channel]["stID"]["id" + id] = 
      [
        id, 
        parsedRewFilter[i]['freq'],
        parsedRewFilter[i]['q'],
        parsedRewFilter[i]['gain']
      ];
  }

  // Save / Download??
});

/*
 * Returns an array of EQ filters
 * filter - {freq, gain, q}
 */

function parseRewFilter(rewFilterContent) {
  let eqFilters = [];

  // Fetch all lines between Headers (Number Enabled ...) and Crossover_filters
  let lineBegin = "Number Enabled Control";
  let lineEnd = "Crossover_filters";

  let lines = rewFilterContent.split("\n"); //
  let startRecord = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.includes(lineBegin)) {
      startRecord = true;
      continue;
    }

    if (line.includes(lineEnd)) {
      break;
    }

    if (startRecord) {
      rewEqLineData = line.split(" ");
      let enabled = rewEqLineData[1];
      let control = rewEqLineData[3];

      if (enabled === "True" && control === "PK") {
        // Zapco "proprietary" unit, 6 decimals, multiply by 10 for gain
        // Follows Zapco GUI limitations for min and max, remove at your own risk!
        // Precision is left as is (up to 6 decimals) so more precision than actual GUI
        let freq = rewEqLineData[4] * 1.0;
        freq = freq.toFixed(0);
        freq = freq < 20 ? 20 : freq;
        freq = freq > 20000 ? 20000 : freq;

        let gain = rewEqLineData[5] * 10;
        gain = gain.toFixed(6);
        gain = gain < -200 ? -200 : gain; // this 200 number is due to zapco "proprietary" unit, nothing wrong
        gain = gain > 100 ? 100 : gain;

        let q = rewEqLineData[6] * 1.0;
        q = q.toFixed(6);
        q = q < 0.5 ? 0.5 : q;
        q = q > 20 ? 20 : q;

        eqFilters.push({
          freq: freq,
          gain: gain,
          q: q,
        });
      }
    }
  }

  return eqFilters;
}
