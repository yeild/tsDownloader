const http = require('http')

module.exports = {
  get (url) {
    url = url.replace(/^https?/, 'http')
    return new Promise(function (resolve, reject) {
      http.get(url, function (res) {
        let data = ''
        res.on('data', function (chunk) {
          data += chunk
        })
        res.on('end', function () {
          resolve({ statusCode: res.statusCode, data })
        })
        res.on('error',reject)
      })
    })
  },
  getBinary (url) {
    url = url.replace(/^https?/, 'http')
    return new Promise(function (resolve, reject) {
      http.get(url, function (res) {
        let data = Buffer.from([])
        res.on('data', function (chunk) {
          data = Buffer.concat([data, Buffer.from(chunk)])
        })
        res.on('end', function () {
          resolve({ statusCode: res.statusCode, data })
        })
        res.on('error', reject)
      })
    })
  }
}