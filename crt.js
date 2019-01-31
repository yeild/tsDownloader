
const fs = require('fs')
const path = require('path')

const resolve = (...args) => path.resolve.apply(null, [__dirname, ...args])

const crypto = require('crypto');
const cipher = crypto.createCipher('aes-128-ecb', 'abc123')
const decipher  = crypto.createDecipher('aes128', 'abc123')

/*
function en () {
  fs.readFile(resolve('0.mp4'), function (e, f) {

    let encrypted = cipher.update(f)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    fs.writeFile(resolve('1.mp4'), encrypted, function () {})
  })
}

function de () {
  fs.readFile(resolve('1.mp4'), function (e, f) {

    let decrypted = decipher.update(f)
    console.log(decrypted)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    console.log(decrypted)
    fs.writeFile(resolve('2.mp4'), decrypted, function () {})
  })
}

de()*/

const input = fs.createReadStream('1.mp4')
const output = fs.createWriteStream('2.mp4')

input.pipe(decipher).pipe(output)
