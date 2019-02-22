const { app, BrowserWindow, ipcMain, dialog } = require('electron')

function createWindow () {
  const window = new BrowserWindow({
    width: 450,
    height: 230,
    frame: false,
    resizable: false,
    transparent: true
  })
  window.setMenu(null)
  //window.webContents.openDevTools()
  window.loadFile('./src/render/index.html')

  ipcMain.on('openDirectory', function ({ sender }) {
    dialog.showOpenDialog({ properties: ['openDirectory'] }, function (files) {
      if (files) sender.send('setSavePath', files[0])
    })
  })
  ipcMain.on('exit', function () {
    window.close()
  })
}

app.on('ready', createWindow)
