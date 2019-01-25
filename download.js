const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const { get, getBuffer } = require('./http')

const resolve = (...args) => path.resolve.apply(null, [__dirname, ...args])

const m3u8 = 'http://pl-ali.youku.com/playlist/m3u8?vid=XNDAwNDUxMzUyOA%3D%3D&type=flvhdv3&ups_client_netip=ded19007&utid=cfEEFNoeNkUCAW644spAMPsE&ccode=0502&psid=d0c5768bfd51257c6f499fdb5197c890&duration=6174&expire=18000&drm_type=1&drm_device=7&ups_ts=1548401530&onOff=0&encr=0&ups_key=fe1843b05c40bfcc8dcf903da9af60e9'

get(m3u8).then(function ({ data }) {
  const lines = data.split('\r\n')
  let nameIndex = 0
  lines.forEach((line) => {
    /*      if (/^#EXT-X-KEY/.test(line)) {
     // 格式 #EXT-X-KEY:METHOD=AES-128,URI="key.key"
     const methodIndex = line.indexOf('METHOD=') + 7
     const method = line.substring(methodIndex, line.indexOf(',', methodIndex))
     const uri = line.substring(line.indexOf('URI=') + 4)
     // todo decrypt
     }*/
    if (/^http.*\.ts.*/.test(line)) addToTask(line, nameIndex++ + '.ts')
  })
  mergeFiles()
})

const downloadTask = []

function addToTask (url, filename) {
  downloadTask.push(getBuffer(url).then(function ({ data }) {
    writeFileSync(filename, data)
  }))
}

function writeFileSync (filename, data) {
  fs.writeFileSync(resolve('temp', filename), data)
}

function mergeFiles () {
  Promise.all(downloadTask).then(function () {
    const from = resolve('temp', '*.ts')
    const to = resolve('temp', 'new.ts')
    exec(`copy /b ${from} ${to}`, function (err) {
      if (err) throw err
      fs.readdir(resolve('temp'), function (err, files) {
        if (err) throw err
        Array.from(files).forEach(function (file) {
          if (file !== 'new.ts') fs.unlinkSync(resolve('temp', file))
        })
        console.log('ok')
      })
    })
  })
}