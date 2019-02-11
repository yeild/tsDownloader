const http = require('http')

exports.get = function ({ url, responseType }) {
  url = url.replace(/^https?/, 'http')
  return new Promise(function (resolve, reject) {
    http.get(url, function (res) {
      let data = Buffer.from([])
      res.on('data', function (chunk) {
        data = Buffer.concat([data, Buffer.from(chunk)])
      })
      res.on('end', function () {
        resolve({ statusCode: res.statusCode, data: responseType === 'binary' ? data : data.toString() })
      })
      res.on('error', reject)
    }).setTimeout(15000, function () {
      this.abort()
      resolve({ statusCode: 408 })
    }).on('error', function () {
      reject({ statusCode: 500 })
    })
  })
}