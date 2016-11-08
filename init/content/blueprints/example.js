"use strict"

const utils = require("multicolour/lib/utils")

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
    salt: "string",
  },

  // Before we create anything, make sure
  // to hash the password for security.
  beforeCreate: (values, next) => {
    // If no password was provided, just move on and exit.
    if (!values.password) {
      return next()
    }

    // Create a salt for this user if they don't have one.
    const salt = utils.create_salt()

    utils.hash_password(values.password, salt, (password, salt) => {
      // Apply the hash and salt to the inbound values.
      values.password = password.toString("hex")
      values.salt = salt

      // Move on.
      next()
    })
  }
}
