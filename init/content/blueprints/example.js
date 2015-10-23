"use strict"

module.exports = {
  attributes: {
    name: {
      required: true,
      type: "string"
    },
    age: {
      required: true,
      type: "integer",
      min: 0,
      max: 9000
    },
    password: {
      required: true,
      type: "string",
      minLength: 5
    }
  },

  // Before we create anything, make sure
  // to hash the password for security.
  beforeCreate: (values, next) => {
    // Get the crypto library.
    const crypto = require("crypto")

    // Create a hash, we're going to encrypt the password.
    const password = crypto.createHash("sha1")
    password.update(values.password)

    // Apply the hash to the inbound values.
    values.password = password.digest("hex")

    // Move on.
    next()
  }
}
