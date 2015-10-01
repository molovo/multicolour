"use strict"

class Config {
  constructor(options) {
    const path = require("path")
    const map = []

    for (const config_key in options) {
      if (config_key === "config" || config_key === "content") {
        map.push([config_key, path.resolve(options[config_key])])
      }
      else {
        map.push([config_key, options[config_key]])
      }
    }

    // Set the options.
    this.options = new Map(map)
  }

  get(prop_name) {
    return this.options.get(prop_name)
  }

  set(prop_name, value) {
    return this.options.set(prop_name, value)
  }
}

module.exports = Config
