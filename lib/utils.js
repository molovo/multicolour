"use strict"

/**
 * Generate a secure string using the Diffie Hellman algorithm.
 *
 * @link https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange
 * @param  {Number} prime_length to generate to.
 * @return {String} salt to use to secure a password.
 */
const create_salt = () => require("crypto")
    .createDiffieHellman(process.env.SALT_GEN_PRIME_LENGTH || 400, "base64")
    .generateKeys("base64")

/**
 * Hash a plain string with the salt and call the callback.
 * @param  {String}   plain_text to hash.
 * @param  {String}   salt to use during hash process.
 * @param  {Function} callback to execute with the new password.
 * @return {void}
 */
function hash_password(plain_text, salt, callback) {
  // Get the crypto library.
  const crypto = require("crypto")

  // These should be a *slow* as possible, higher = slower.
  // Slow it down until you tweak a bounce change.
  const password_iterations = process.env.PW_GEN_PW_ITERS || 4096

  // Password length and algorithm.
  const password_length = process.env.PW_GEN_PW_LENGTH || 512
  const password_algorithm = process.env.PW_GEN_PW_ALG || "sha256"

  // Create a hash, we're going to encrypt the password.
  // I wish Node had native support for good KDF functions
  // like bcrypt or scrypt but PBKDF2 is good for now.
  crypto.pbkdf2(plain_text, salt, password_iterations, password_length, password_algorithm, (err, key) => {
    // Move on.
    callback(key.toString("hex"), salt)
  })
}

/**
 * Remove any null or undefined values from
 * an object and return it.
 * @param  {Object} object to remove empties from.
 * @return {Object} object without empties.
 */
function remove_null_undefined(object) {
  Object.keys(object).forEach(key => {
    if (object[key] === null || typeof object[key] === "undefined") {
      delete object[key]
    }
  })

  return object
}

/**
 * Some of the sails adapters are shockingly bad,
 * the memory adapter is one of them. Kill it with fire.
 * @param  {Multicolour} multicolour to kill adapters on.
 * @return {Multicolour} multicolour instance.
 */
function kill_sails_memory_adapter_with_unholy_fire(multicolour) {
  const {adapters} = multicolour.get("config").get("db")

  // Check each adapter.
  Object.keys(adapters).forEach(adapter => {
    if (adapters[adapter].identity === "sails-memory") {
      adapters[adapter].teardown(() => {})
    }
  })

  return multicolour
}

// Export the tools.
module.exports.create_salt = create_salt
module.exports.hash_password = hash_password
module.exports.remove_null_undefined = remove_null_undefined
module.exports.kill_sails_memory_adapter_with_unholy_fire = kill_sails_memory_adapter_with_unholy_fire
