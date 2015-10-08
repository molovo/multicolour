"use strict"

// Get the Waterline library.
const Waterline = require("waterline")

class Waterline_Generator extends Map {
  /**
   * Instantiated by Multicolour to create database models.
   * @return {Multicolour_Server_Hapi} For immediate object return.
   */
  constructor() {
    // Construct.
    super()

    // Create the Waterline instance we'll register models with.
    const waterline = new Waterline()
    this.reply("waterline", waterline)

    // For path resolution.
    const path = require("path")

    // Generate the schemas.
    this.request("host").get("blueprints")
      // Resolve their location.
      .map(file_path => path.resolve(file_path))

      // Get the file and it's name.
      .map(file_path => {
        return {
          name: require("pluralize")(path.basename(file_path, ".js"), 1),
          model: require(file_path)
        }
      })

      // Generate the collections.
      .map(this.generate_model.bind(this))

      // Register them with Waterline.
      .map(waterline.loadCollection.bind(waterline))

    return this
  }

  /**
   * Generate Waterline models from the blueprint JSON.
   * @param  {Object} blueprint to generate from.
   * @return {Waterline.Collection} generated Waterline Collection.
   */
  generate_model(blueprint) {
    // To fix names of things.
    const pluralize = require("pluralize")

    // Fix the name.
    const name = pluralize(blueprint.name)

    // Create the collection.
    const collection = Waterline.Collection.extend({
      identity: name,
      attributes: blueprint.model,
      connection: process.env.NODE_ENV || "production"
    })

    // Return the collection.
    return collection
  }

  /**
   * Start the database connector.
   * @param  {Function} callback to pass to the underlying tech.
   * @return {void}
   */
  start(callback) {
    // Get the config.
    const config = this.request("host").get("config").get("db") || {}

    // Check we got a callback.
    if (!(callback instanceof Function)) {
      throw new TypeError("Incorrect usage of db.start(Function callback)")
    }

    // Start Waterline.
    this.request("waterline").initialize(config, (error, models) => {
      // Set the models.
      this.set("models", models.collections)

      // Call home.
      callback(error, models)
    })
  }
}


// Export the required config for Multicolour
// to register.
module.exports = host => {
  return {
    // It's a server generator, use that type.
    type: host.get("types").DATABASE_GENERATOR,

    // The generator is the class above.
    generator: Waterline_Generator
  }
}
