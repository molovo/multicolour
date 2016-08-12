"use strict"

// Get our tools.
const path = require("path")
const joi = require("joi")
const chalk = require("chalk")

class Config extends Map {

  /**
   * The config schema to validate against.
   * @return {object} a Joi schema to validate passed config against.
   */
  static get schema() {
    return joi.object({
      content: joi.string().required(),
      settings: joi.object({
        timeout: joi.number().positive(),
        results: joi.object({
          per_page: joi.number().positive()
        }),
        route_prefix: joi.string(),
        javascript_sdk: joi.object({
          destination: joi.string().required(),
          module_name: joi.string()
        })
      }),
      auth: joi.object({
        password: joi.string().min(20).required(),
        providers: joi.array().items({
          provider: joi.string().required(),
          clientId: joi.string().required(),
          clientSecret: joi.string().required(),
          isSecure: joi.boolean().required()
        }).required()
      }),
      db: joi.object({
        adapters: joi.object().required(),
        connections: joi.object().required()
      })
    }).unknown(true)
  }

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
      content: `${__dirname}/content`,
      settings: {
        results: {
          per_page: 20
        }
      }
    }

    // Extend the defaults with our options,
    // overwriting any of the defaults.
    options = Object.assign(defaults, options)

    // Validate our config.
    const validated = joi.validate(options, Config.schema)

    // Check for errors.
    if (validated.error) {
      /* eslint-disable */
      console.error(chalk.red.underline.bold("There is an error in your config.js"))
      console.error(chalk.red(validated.error))
      /* eslint-enable */

      throw validated.error
    }
    else {
      // Update the options to the validated value.
      options = validated.value
    }

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

  /**
   * return a stringified version of the config
   * object.
   * @return {String} prettified object.
   */
  toString() {
    return JSON.stringify([...this], null, 2)
  }
}

module.exports = Config
