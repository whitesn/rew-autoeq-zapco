const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Notification,
} = require("electron");
const path = require("path");
const fs = require("fs");
const MAX_EQ_BAND_COUNT = 15;

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
  // let defaultChData = fs.readFileSync("./examples/defaultZapcoChData.txt");
  let defaultChData = JSON.parse(
    '{"id1":[1,25,3.610000,0.000000],"id2":[2,40,3.610000,0.000000],"id3":[3,63,3.610000,0.000000],"id4":[4,100,3.610000,0.000000],"id5":[5,160,3.610000,0.000000],"id6":[6,250,3.610000,0.000000],"id7":[7,400,3.610000,0.000000],"id8":[8,630,3.610000,0.000000],"id9":[9,1000,3.610000,0.000000],"id10":[10,1600,3.610000,0.000000],"id11":[11,2500,3.610000,0.000000],"id12":[12,4000,3.610000,0.000000],"id13":[13,6300,3.610000,0.000000],"id14":[14,10000,3.610000,0.000000],"id15":[15,16000,3.610000,0.000000]}'
  );

  parsedZapcoEq["Channle" + channel]["stID"] = defaultChData;

  // Channle<1-8>.stID.id<1-15>
  // [<id>, <freq>, <q>, <gain>]
  for (let i = 0; i < parsedRewFilter.length; i++) {
    let id = i + 1;

    parsedZapcoEq["Channle" + channel]["stID"]["id" + id] = [
      id,
      Number(parsedRewFilter[i]["freq"]),
      Number(parsedRewFilter[i]["q"]),
      Number(parsedRewFilter[i]["gain"]),
    ];
  }

  dialog
    .showSaveDialog({
      title: "Select the File Path to save",
      defaultPath: path.join(__dirname, "./out.xps"),
      buttonLabel: "Save",
      // Restricting the user to only Text Files.
      filters: [
        {
          name: "Zapco EQ File",
          extensions: ["xps"],
        },
      ],
      properties: [],
    })
    .then((file) => {
      console.log(file.canceled);
      if (!file.canceled) {
        console.log(file.filePath.toString());

        fs.writeFile(
          file.filePath.toString(),
          JSON.stringify(parsedZapcoEq),
          function (err) {
            if (err) throw err;
            console.log("Saved!");

            new Notification({
              title: "REW AUTOEQ TO ZAPCO",
              body: "Successfully generated Zapco Eq File!",
            }).show();
          }
        );
      }
    })
    .catch((err) => {
      console.log(err);
    });
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
    
    if (eqFilters.length >= MAX_EQ_BAND_COUNT) {
      break;
    }
  }

  return eqFilters;
}
