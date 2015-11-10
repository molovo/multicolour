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
        const model = require(file_path)
        return {
          name: model.identity || path.basename(file_path, ".js"),
          model: model
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
    // Default some values.
    blueprint.model.identity = require("pluralize")(blueprint.name, 1)
    blueprint.model.migrate = blueprint.model.migrate || "safe"
    blueprint.model.connection = blueprint.model.connection || this.request("host").get("env")

    // Check for associations while this issue
    // is still happening. https://github.com/balderdashy/waterline/issues/797
    // Loop over the attributes to find any associates (model: "blah")
    for (const attribute in blueprint.model.attributes) {
      // Does it have a model property?
      if (blueprint.model.attributes[attribute].hasOwnProperty("model")) {
        // Do we already have some associations?
        if (!blueprint.model.hasOwnProperty("associations")) {
          blueprint.model.associations = []
        }

        // Add our new association.
        blueprint.model.associations.push({ alias: attribute })
      }
    }

    // Create the collection.
    const collection = Waterline.Collection.extend(blueprint.model)

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
    const env = this.request("host").get("env")

    // Get our connections.
    const connections = JSON.parse(JSON.stringify(config.connections))

    // Remove the environments.
    delete config.connections.production
    delete config.connections.development

    // Re-apply the correct environment
    config.connections[env] = connections[env]

    // Check we got a callback.
    if (!(callback instanceof Function)) {
      throw new TypeError("Incorrect usage of db.start(Function callback)")
    }

    // Try to start Waterline.
    this.request("waterline").initialize(config, callback)
  }
}

// Export the required config for Multicolour
// to register.
module.exports = {
  // It's a server generator, use that type.
  type: require("./consts").DATABASE_GENERATOR,

  // The generator is the class above.
  generator: Waterline_Generator
}
