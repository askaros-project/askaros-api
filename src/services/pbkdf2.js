const log = require("./log")("pbkdf2")
import Promise from "bluebird"
const crypto = Promise.promisifyAll(require("crypto"))

// larger numbers mean better security, less
var config = {
  // size of the generated hash
  hashBytes: 32,
  // larger salt means hashed passwords are more resistant to rainbow table, but
  // you get diminishing returns pretty fast
  saltBytes: 16,
  // more iterations means an attacker has to take longer to brute force an
  // individual password, so larger is better. however, larger also means longer
  // to hash the password. tune so that hashing the password takes about a
  // second
  iterations: 82791,
  algo: "sha512",
  encoding: "base64"
}

function generateRandomToken(len) {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(len, function(err, buffer) {
      if (err) {
        reject(err)
      } else {
        resolve(buffer.toString("hex"))
      }
    })
  })
}

/**
 * Hash a password using Node's asynchronous pbkdf2 (key derivation) function.
 *
 * Returns a self-contained buffer which can be arbitrarily encoded for storage
 * that contains all the data needed to verify a password.
 *
 * @param {!String} password
 * @param {!function(?Error, ?Buffer=)} callback
 */
function hashPassword(password) {
  let salt
  return crypto
    .randomBytesAsync(config.saltBytes)
    .then(function(vsalt) {
      salt = vsalt
      return crypto.pbkdf2Async(
        password,
        salt,
        config.iterations,
        config.hashBytes,
        config.algo
      )
    })
    .then(function(hash) {
      var array = new ArrayBuffer(hash.length + salt.length + 8)
      var hashframe = Buffer.from(array)
      // extract parameters from buffer
      hashframe.writeUInt32BE(salt.length, 0, true)
      hashframe.writeUInt32BE(config.iterations, 4, true)
      salt.copy(hashframe, 8)
      hash.copy(hashframe, salt.length + 8)
      return hashframe.toString(config.encoding)
    })
}

/**
 * Verify a password using Node's asynchronous pbkdf2 (key derivation) function.
 *
 * Accepts a hash and salt generated by hashPassword, and returns whether the
 * hash matched the password (as a boolean).
 *
 * @param {!String} password
 * @param {!Buffer} combined Buffer containing hash and salt as generated by
 *   hashPassword.
 * @param {!function(?Error, !boolean)}
 */
function verifyPassword(password, hashframe) {
  // decode and extract hashing parameters
  hashframe = Buffer.from(hashframe, config.encoding)
  var saltBytes = hashframe.readUInt32BE(0)
  var hashBytes = hashframe.length - saltBytes - 8
  var iterations = hashframe.readUInt32BE(4)
  var salt = hashframe.slice(8, saltBytes + 8)
  var hash = hashframe.slice(8 + saltBytes, saltBytes + hashBytes + 8)
  // verify the salt and hash against the password
  return crypto
    .pbkdf2Async(password, salt, iterations, hashBytes, config.algo)
    .then(function(verify) {
      if (verify.equals(hash)) return Promise.resolve(true)
      return Promise.resolve(false)
    })
}
export default {
  hashPassword: hashPassword,
  verifyPassword,
  generateRandomToken
}
