"use strict"

// Get our tools.
const path = require("path")
const extend = require("util")._extend

class Config extends Map {
  /**
   * Take a dictionary of options and set them
   * directly on this config object.
   * @param  {Object} options and values to set.
   * @return {Config} Config instance.
   */
  constructor(options) {
    // Construct.
    super()

    // The default configuration.
    const defaults = {
      settings: {
        results: {
          per_page: 20
        }
      }
    }

    // Extend the defaults with our options,
    // overwriting any of the defaults.
    options = extend(defaults, options)

    // Loop over the options.
    for (const config_key in options) {
      if (config_key === "config" || config_key === "content") {
        this.set(config_key, path.resolve(options[config_key]))
      }
      else {
        this.set(config_key, options[config_key])
      }
    }

    // Exit.
    return this
  }

  /**
   * Create a new Config instance from a config file
   * path and return it.
   * @param  {String} config_path to load.
   * @return {Config} Newly created Config instance.
   */
  static new_from_file(config_path) {
    // Get the config file.
    const config_file = require(path.resolve(config_path))

    // Create a new config from it.
    return new Config(config_file)
  }
}

module.exports = Config
