const fs = require('fs')
const path = require('path')
const { get } = require('./http')
const { decrypt } = require('./decrypt')

const downloadConfig = {
  temp: '', // 缓存文件路径
  filename: '', // 保存文件的完整路径
  maxRequestTime: 5, // 最大重试次数
  key: null, // encrypt key
  set ({ temp, filename }) {
    this.temp = temp
    this.filename = filename
  }
}

const downloadStatus = {
  doneCount: 0,
  failedList: [],
  requestTime: 1, // 当前请求次数
  reset () {
    this.doneCount = 0
    this.failedList = []
    this.requestTime = 1
  }
}

exports.resolve = function ({ m3u8, savePath, filename }) {
  downloadConfig.set({
    temp: path.resolve(savePath, Date.now().toString()),
    filename: path.resolve(savePath, filename)
  })
  downloadStatus.reset()
  return new Promise(function (resolve, reject) {
    const videoList = []
    get({ url: m3u8 }).then(function ({ statusCode, data }) {
      if (statusCode !== 200) return reject('未能识别到视频文件')
      const lines = data.split('\n')
      const encryptInfo = {}
      lines.forEach(function (line, index) {
        line = line.trim()
        if (/\.ts/.test(line)) videoList.push({ url: new URL(line, m3u8).href, name: index.toString() })
        if (/#EXT-X-KEY/.test(line)) line.split(',').forEach(function (pair) {
          const key = pair.split('=')[0]
          const value = pair.split('=')[1]
          try {
            encryptInfo[key] = JSON.parse(value)
          } catch (e) {
            encryptInfo[key] = value
          }
        })
      })
      if (videoList.length === 0) reject('未能识别到视频文件')
      if (!encryptInfo.key) resolve(videoList)
      else {
        get({ url: new URL(encryptInfo.key, m3u8).href}).then(function ({ statusCode, data }) {
          if (statusCode !== 200) return reject('获取密钥失败')
          downloadConfig.key = data
          resolve(videoList)
        })
      }
    }).catch(function (e) {
      console.log(e)
      reject('无效的链接')
    })
  })
}

exports.download = download

function download ({ videoList, progress, finish }) {
  const downloadTask = []
  videoList.forEach(function (video) {
    const { url, name } = video
    downloadTask.push(get({ url, responseType: 'binary' }).then(function ({ statusCode, data }) {
      if (statusCode !== 200) downloadStatus.failedList.push(video)
      else {
        const { temp, key } = downloadConfig
        if (!fs.existsSync(temp)) fs.mkdirSync(temp)
        if (key) data = decrypt(key, data) // 解密文件
        fs.writeFileSync(path.resolve(temp, name), data)
        progress({ doneCount: downloadStatus.doneCount++ })
      }
    }).catch(function (e) {
      console.log(e)
      downloadStatus.failedList.push(video)
    }))
  })

  handlePromiseDone(downloadTask, progress, finish)
}

function handlePromiseDone (requestList, progress, finish) {
  Promise.all(requestList).then(function () {
    const { temp, filename, maxRequestTime } = downloadConfig
    const { failedList, doneCount } = downloadStatus
    const failCount = failedList.length
    if (failCount > 0 && downloadStatus.requestTime++ < maxRequestTime) { // 如果有失败视频并且尝试次数不超过最大尝试次数
      download({ videoList: failedList, progress, finish }) // 重新下载该视频
      downloadStatus.failedList = [] // 清空本轮请求的failedList
    } else { // 所有请求都成功后，或者达到了最大尝试次数
      // 读取缓存文件&合并
      fs.readdir(temp, function (err, files) {
        if (err) { // 文件夹不存在，表示下载失败
          finish({ doneCount: downloadStatus.doneCount, failCount })
          return
        }
        const output = fs.createWriteStream(filename)
        files.sort((a, b) => a - b) // 文件名按数字排序以保证合并顺序
        files.forEach(function (file) {
          const piece = path.resolve(temp, file)
          output.write(fs.readFileSync(piece))
          fs.unlinkSync(piece) // 写入后删除该缓存文件
        })
        fs.rmdirSync(path.resolve(temp)) // 合并完成后删除temp文件夹
        finish({ doneCount, failCount })
      })
    }
  }).catch(e => {
    console.log(e)
  })
}
