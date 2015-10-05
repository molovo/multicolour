"use strict"

const path = require("path")

class Config {
  /**
   * Take a dictionary of options and set them
   * directly on this config object.
   * @param  {Object} options and values to set.
   * @return {Config} Config instance.
   */
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

  /**
   * Get a value from the options set.
   * @param  {String} prop_name to get.
   * @return {Any} Whatever is stored at that key.
   */
  get(prop_name) {
    return this.options.get(prop_name)
  }

  /**
   * Set a value on the options set.
   * @param  {String} prop_name to set.
   * @param  {String} value to set.
   * @return {Config} Config for chaining.
   */
  set(prop_name, value) {
    this.options.set(prop_name, value)

    return this
  }

  /**
   * Create a new Config instance from a config file
   * path and return it.
   * @param  {String} config_path to load.
   * @return {Config} Newly created Config instance.
   */
  new_from_file(config_path) {
    // Get the config file.
    const config_file = require(path.resolve(config_path))

    // Create a new config from it.
    return new Config(config_file)
  }
}

module.exports = Config
