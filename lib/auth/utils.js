"use strict"

module.exports = {
  /**
   * Encrypt a string using the PBKDF2/SHA256 algorithm.
   * @param  {String} string to encrypt.
   * @param  {String} salt to use during encryption.
   * @return {String} encrpyted password.
   */
  encrypt: (string, salt) => require("crypto")
    .pbkdf2Sync(string, salt, 4096, 512, "sha256")
    .toString("hex")
}
