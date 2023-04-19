const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  submitForm: (rewFilter, zapcoEqFile, channel) =>
    ipcRenderer.send("submit-form", rewFilter, zapcoEqFile, channel),
});
