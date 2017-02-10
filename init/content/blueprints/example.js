"use strict"

/**
 * This is an example blueprint, it features
 * some of the basic functionality you might
 * want to implement yourself, in your own API.
 *
 * Feel free to delete this file and create your
 * own blueprints.
 *
 * We (Dave, Joe and Jamie) hope you enjoy using
 * Multicolour to make your APIs easier.
 *
 * If you need any help, join the Slack channel:
 *   https://slack.getmulticolour.com/ ❤
 */

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
    },
    salt: "string",
  },

  /**
   * An example, lifecyle callback.
   *
   * This example takes the values passed in,
   * checks if it has a password present and it then
   * generates a new salt and hashes the password before
   * continueing with the write operation.
   *
   * @param  {Object} values passed in to create.
   * @param  {Function} next function in the queue to run.
   * @return {void}
   */
  beforeCreate: (values, next) => {

    // If no password was provided, just move on and exit.
    if (!values.password) {
      return next()
    }

    const utils = require("multicolour/lib/utils")

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
