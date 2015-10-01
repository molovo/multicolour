"use strict"

class Config {
  constructor(options) {
    const path = require("path")

    // Defaults for options.
    this.defaults = {
      config_file: null
    }

    for (const config_key in options) {
      if (config_key === "config" || config_key === "content") {
        options[config_key] = path.resolve(options[config_key])
      }
    }

    // Set the options.
    this.options = Object.freeze(Object.assign(this.defaults, options || {}))
  }

  get(prop_name) {
    return this.options[prop_name]
  }
}

module.exports = Config
