const fs = require('fs')
const path = require('path')
const { get } = require('./http')

let SAVE_PATH // 保存路径
let FILE_NAME // 保存文件名
let TEMP // 存放ts片段的临时文件夹

exports.resolve = function ({ m3u8, savePath, filename }) {
  SAVE_PATH = savePath
  FILE_NAME = path.resolve(savePath, filename)
  TEMP = path.resolve(savePath, Date.now().toString())
  return new Promise(function (resolve, reject) {
    const videoList = []
    get({ url: m3u8 }).then(function ({ statusCode, data }) {
      if (statusCode !== 200) return reject(statusCode)

      const lines = data.split('\r\n')
      lines.forEach(function (line, index) {
        if (/^http.*\.ts.*/.test(line)) videoList.push({ url: line, name: index.toString() })
      })
      resolve(videoList)
    })
  })
}

let doneCount = 0
let failedList = [] // 下载失败的视频链接
exports.download = function ({ videoList, progress, finish }) {
  const downloadTask = []
  videoList.forEach(function (video) {
    const { url, name } = video
    downloadTask.push(get({ url, responseType: 'binary' }).then(function ({ statusCode, data }) {
      if (statusCode !== 200) failedList.push(video)
      else {
        if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP)
        fs.writeFileSync(path.resolve(TEMP, name), data)
        progress({ doneCount: doneCount++ })
      }
    }).catch(function (e) {
      console.log(e)
      failedList.push(video)
    }))
  })

  handlePromiseDone(downloadTask, progress, finish)
}

// 重试下载失败的视频
let requestTime = 1 // 当前尝试次数
let maxRequestTime = 5 // 最大尝试次数
function handlePromiseDone (requestList, progress, finish) {
  Promise.all(requestList).then(function () {
    let failCount = failedList.length
    if (failCount > 0 && requestTime++ < maxRequestTime) { // 如果有失败视频并且尝试次数不超过最大尝试次数
      download({ videoList: failedList, progress, finish }) // 重新下载该视频
      failedList = [] // 清空本轮请求的failedList
    } else { // 表示所有请求都成功了，或者达到了最大尝试次数。
      // 合并文件
      const writeStream = fs.createWriteStream(FILE_NAME)
      fs.readdir(TEMP, function (err, files) {
        if (err) throw err
        files.sort((a, b) => a - b) // 文件名按数字排序保证顺序
        files.forEach(function (filename) {
          const file = path.resolve(TEMP, filename)
          writeStream.write(fs.readFileSync(file))
          fs.unlinkSync(file) // 写完后删除该文件片段
        })
        fs.rmdirSync(path.resolve(TEMP)) // 合并完成后删除temp文件夹
        finish({ doneCount, failCount })
      })
    }
  }).catch(e => {
    console.log(e)
  })
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
