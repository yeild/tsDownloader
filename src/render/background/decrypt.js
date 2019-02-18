const crypto = require("crypto")

exports.decrypt = function (key, data) {
  // 暂未遇到非AES128加密和非默认iv的情况，遇到后再处理
  const method = 'aes-128-cbc'
  const iv = Buffer.alloc(16, 0)
  const decipher = crypto.createDecipheriv(method, key, iv)
  let decrypted = decipher.update(data)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted
}
