const fs = require('fs')
const path = require('path')
const { ipcRenderer, shell } = require('electron')
const { resolve, download } = require('./background/download')

const querySelector = document.querySelector.bind(document)
const addEventListener = function (selector, event, handler) {
  querySelector(selector).addEventListener(event, handler)
}

const downloadInfo = (function () {
  const defaultSavePath = localStorage.getItem('savePath') || 'C:'
  const ext = '.ts' // 文件默认后缀
  const savePathInput = querySelector('#savePathInput')
  const filenameInput = querySelector('#filenameInput')

  savePathInput.value = defaultSavePath
  filenameInput.value = Date.now()
  querySelector('#ext').innerHTML = ext
  return {
    getM3u8Url () {
      return querySelector('#m3u8Input').value
    },
    getSavePath () {
      return savePathInput.value
    },
    setSavePath (path) {
      localStorage.setItem('savePath', path)
      console.log(path)
      savePathInput.value = path
    },
    getFilename () {
      return filenameInput.value + ext
    },
    getFullPath () {
      return path.resolve(this.getSavePath(), this.getFilename())
    }
  }
}())

addEventListener('#filenameInput', 'input', function () {
  const value = this.value
  const reg = /[\\/:*?"<>|]/g
  if (reg.test(value)) {
    showTips('filename', '文件名不能包含下列任何字符: \\/:*?"<>|')
    this.value = value.replace(reg, '')
  }
})

addEventListener('#chooseDirBtn', 'click', function () {
  ipcRenderer.send('openDirectory')
})

ipcRenderer.on('setSavePath', function (event, path) {
  downloadInfo.setSavePath(path)
})

addEventListener('#openDir', 'click', function () {
  shell.showItemInFolder(downloadInfo.getFullPath())
})

addEventListener('#openFile', 'click', function () {
  shell.openItem(downloadInfo.getFullPath())
})

addEventListener('#closeBtn', 'click', function () {
  confirm('有下载任务正在进行，是否退出？')
})

addEventListener('#downloadBtn', 'click', function () {
  if (querySelector('#m3u8Input').value === '') {
    showTips('url', `请输入下载地址`)
    return
  }
  if (querySelector('#filenameInput').value === '') {
    showTips('filename', `请输入文件名`)
    return
  }
  const fullPath = downloadInfo.getFullPath()
  if (fs.existsSync(fullPath)) {
    showTips('filename', `文件${fullPath}已存在`)
    return
  }
  lockBtn()
  const id = setTimeout(function () {
    setInfoStatus('prepare') // 延迟显示准备信息，防止信息闪现
  }, 400)
  resolve({
    m3u8: downloadInfo.getM3u8Url(),
    savePath: downloadInfo.getSavePath(),
    filename: downloadInfo.getFilename()
  }).then(function (videoList) {
    clearTimeout(id)
    // querySelector('#taskCount').innerHTML = videoList.length
    const totalCount = videoList.length
    setInfoStatus('progress')
    querySelector('#progressBar').style.width = 0
    querySelector('#percent').innerHTML = ''
    download({
      videoList,
      progress ({ doneCount }) {
        const percent = (doneCount / totalCount * 100).toFixed(2)
        querySelector('#progressBar').style.width = percent + '%'
        querySelector('#percent').innerHTML = doneCount + '/' + totalCount
      },
      finish ({ doneCount, failCount }) {
        if (doneCount === 0) setInfoStatus('error')
        else {
          setInfoStatus('success')
          if (failCount > 0) querySelector('#notice').innerHTML = `共下载${doneCount}个文件, ${failCount}个文件无法下载)`
        }
        unlockBtn()
      }
    })
  }).catch(msg => {
    clearTimeout(id)
    showTips('url', msg)
    setInfoStatus('init')
    unlockBtn()
  })
})

const showTips = (function () {
  let id
  return function (type, tips, delay = 3000) {
    id && clearTimeout(id)
    const selector = type === 'url' ? '#urlTooltip' : '#filenameTooltip'
    const tooltip = querySelector(selector)
    tooltip.setAttribute('tips', tips)
    tooltip.classList.add('tooltip-active')
    id = setTimeout(function () {
      tooltip.classList.remove('tooltip-active')
    }, delay)
  }
}())

function setInfoStatus (status) {
  querySelector('#info').className = status === 'init' ? 'row' : `row info-${status}`
}

function lockBtn () {
  querySelector('#chooseDirBtn').setAttribute('disabled', 'disabled')
  querySelector('#downloadBtn').setAttribute('disabled', 'disabled')
  querySelector('#m3u8Input').setAttribute('disabled', 'disabled')
  querySelector('#filenameInput').setAttribute('disabled', 'disabled')
}

function unlockBtn () {
  querySelector('#chooseDirBtn').removeAttribute('disabled')
  querySelector('#downloadBtn').removeAttribute('disabled')
  querySelector('#m3u8Input').removeAttribute('disabled')
  querySelector('#filenameInput').removeAttribute('disabled')
}
