const { app, BrowserWindow, ipcMain, dialog } = require('electron')

function createWindow () {
  const window = new BrowserWindow({
    width: 600,
    height: 300,
    frame: false,
    resizable: true,
    transparent: true
  })
  // window.setMenu(null)
   window.webContents.openDevTools()
  window.loadFile('./src/render/index.html')

  ipcMain.on('openDirectory', function ({ sender }) {
    dialog.showOpenDialog({ properties: ['openDirectory'] }, function (files) {
      if (files) sender.send('setSavePath', files[0])
    })
  })
}

app.on('ready', createWindow)
