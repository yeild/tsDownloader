const http = require('http')

exports.get = function ({ url, responseType }) {
  url = url.replace(/^https?/, 'http') // https转为http请求
  if (!/^http:\/\//.test(url))  url = 'http://' + url
  return new Promise(function (resolve, reject) {
    http.get(url, function (res) {
      let data = Buffer.from([])
      res.on('data', function (chunk) {
        data = Buffer.concat([data, Buffer.from(chunk)])
      })
      res.on('end', function () {
        resolve({ statusCode: res.statusCode, data: responseType === 'binary' ? data : data.toString() })
      })
    }).setTimeout(15000, function () {
      this.abort()
      reject({ statusCode: 408, msg: 'Request Timeout'})
    }).on('error', reject)
  })
}
