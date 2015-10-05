"use strict"

const path = require("path")

class Config {
  constructor(options) {
    // Set the options.
    this.options = new Map()

    for (const config_key in options) {
      if (config_key === "config" || config_key === "content") {
        this.set(config_key, path.resolve(options[config_key]))
      }
      else {
        this.set(config_key, options[config_key])
      }
    }

    return this
  }

  get(prop_name) {
    return this.options.get(prop_name)
  }

  set(prop_name, value) {
    this.options.set(prop_name, value)

    return this
  }

  new_from_file(config_path) {
    const config_file = require(path.resolve(config_path))

    return new Config(config_file)
  }
}

module.exports = Config
