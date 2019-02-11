const fs = require('fs')

const { get } = require('./http')

// const m3u8 = 'http://pl-ali.youku.com/playlist/m3u8?vid=XNDAwNDUxMzUyOA%3D%3D&type=flvhdv3&ups_client_netip=ded19007&utid=cfEEFNoeNkUCAW644spAMPsE&ccode=0502&psid=d0c5768bfd51257c6f499fdb5197c890&duration=6174&expire=18000&drm_type=1&drm_device=7&ups_ts=1548401530&onOff=0&encr=0&ups_key=fe1843b05c40bfcc8dcf903da9af60e9'

const downloadTask = []
const failedList = []
let doneCount = 0
let failCount = 0

const videoList = []
exports.resolve = function (m3u8) {
  return new Promise(function (resolve, reject) {
    get({ url: m3u8 }).then(function ({ statusCode, data }) {
      if (statusCode !== 200) {
        reject(statusCode)
        return
      }
      const lines = data.split('\r\n')
      lines.forEach((line) => {
        if (/^http.*\.ts.*/.test(line)) {
          videoList.push(line)
        }
      })
      resolve(videoList)
    })
  })
}

exports.download = function ({ videoList, progress, finish }) {
  videoList.forEach(function (video, index) {
    addToTask(video, index, progress)
  })
  Promise.all(downloadTask).then(function () {
    failedList.forEach(function (video, index) {
      addToTask(video, index, progress)
    })
    const writeStream = fs.createWriteStream('name.ts')

    fs.readdir('temp', function (e, files) {
      files.forEach(file => {
        writeStream.write(fs.readFileSync('temp/'+ file))
      })

      finish({ doneCount, failCount })
    })
  })
}


/*exports.getList = function (m3u8, singleTaskFinish, allTaskFinish) {
  return new Promise(function (resolve, reject) {
    get(m3u8).then(function ({ statusCode, data }) {
      if (statusCode !== 200) {
        reject(statusCode)
        return
      }
      const lines = data.split('\r\n')
      lines.forEach((line) => {
        if (/^http.*\.ts.*!/.test(line)) {
          addToTask(line, taskCount, singleTaskFinish)
          taskCount++
        }
      })
      resolve(taskCount)
      Promise.all(downloadTask).then(function () {
        allTaskFinish({ taskCount, doneCount, failCount })
      })
    })
  })
}*/

function addToTask (url, index, progress) {
  downloadTask.push(get({ url, responseType: 'binary' }).then(function ({ statusCode, data }) {
    if (statusCode !== 200) {
      failCount++
      failedList.push(url)
    }
    else {
      doneCount++
      fs.writeFile('temp/'+ index, data, function (err) {
        if (err) throw err
      })
    }
    progress({ doneCount, failCount })
  }))
}


/*

get(m3u8).then(function ({ data }) {
  const lines = data.split('\r\n')
  let nameIndex = 0
  lines.forEach((line) => {
    /!*      if (/^#EXT-X-KEY/.test(line)) {
     // 格式 #EXT-X-KEY:METHOD=AES-128,URI="key.key"
     const methodIndex = line.indexOf('METHOD=') + 7
     const method = line.substring(methodIndex, line.indexOf(',', methodIndex))
     const uri = line.substring(line.indexOf('URI=') + 4)
     // todo decrypt
     }*!/
    if (/^http.*\.ts.*!/.test(line)) addToTask(line, nameIndex++ + '.ts')
  })
})
*/
