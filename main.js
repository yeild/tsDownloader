const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron')


function createWindow () {
  // Menu.setApplicationMenu(null)
  // 创建浏览器窗口
  win = new BrowserWindow({ width: 600, height: 370, frame: true })
  win.webContents.openDevTools()
  // 然后加载应用的 index.html。
  win.loadFile('./index.html')

  ipcMain.on('openDirectory', function ({ sender }) {
    dialog.showOpenDialog({ properties: ['openDirectory'] }, function (files) {
      if (files) sender.send('savePath', files[0])
    })
  })
}

app.on('ready', createWindow)
