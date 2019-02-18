const http = require('http')
const https = require('https')

exports.get = function ({ url, responseType }) {
  if (!/^https?:\/\//.test(url))  url = 'http://' + url
  const protocol = /^http:\/\//.test(url) ? http : https
  return new Promise(function (resolve, reject) {
    protocol.get(url, function (res) {
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
