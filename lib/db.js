"use strict"

// Get the tools.
const Waterline = require("waterline")
const Plugin = require("./plugin")

class Multicolour_Waterline_Generator extends (Plugin, Map) {
  /**
   * Instantiated by Multicolour to create database models.
   * @return {Multicolour_Waterline_Generator} Multicolour_Waterline_Generator for chaining.
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
        // Get the model.
        const model = require(file_path)

        // Create the format the rest of this module requires.
        return {
          name: model.identity || path.basename(file_path, ".js"),
          model: model
        }
      })

      // Generate the models.
      .map(this.generate_model.bind(this))

      // Register them with Waterline.
      .map(waterline.loadCollection.bind(waterline))

    return this
  }

  /**
   * Set the property required by other mechanisms
   * on the host.
   * @param  {Multicolour} multicolour instance running this plugin.
   * @return {void}
   */
  register(multicolour) {
    multicolour.set("database", this)
  }

  /**
   * By default, we don't want any NULL
   * or undefined values in our response.
   * @return {Object} without any undefined or null values.
   */
  defaultToJSON(original) {
    // Get the object.
    let model = this.toObject()

    // Call the original toJSON method on the model.
    if (original && original instanceof Function) {
      model = original.call(this)
    }

    // Remove any NULL/undefined values.
    Object.keys(model).forEach(key => {
      if (model[key] === null || typeof model[key] === "undefined") {
        delete model[key]
      }
    })

    // Return the modified object.
    return model
  }

  /**
   * Generate Waterline models from the blueprint JSON.
   * @param  {Object} blueprint to generate from.
   * @return {Waterline.Collection} generated Waterline Collection.
   */
  generate_model(blueprint) {
    // Default some values.
    blueprint.model.identity = require("pluralize")(blueprint.name, 1)
    blueprint.model.connection = blueprint.model.connection || this.request("host").get("env")
    blueprint.model.migrate = blueprint.model.migrate || "safe"

    // If no toJSON method exists, create a default.
    if (!blueprint.model.attributes.hasOwnProperty("toJSON")) {
      blueprint.model.attributes.toJSON = this.defaultToJSON
    }
    // Otherwise, wrap the one we have to standardise behaviour.
    else {
      // Get the current value.
      const original_toJSON = blueprint.model.attributes.toJSON
      const new_toJSON = this.defaultToJSON

      // Wrap it to remove null and undefined values.
      blueprint.model.attributes.toJSON = function() {
        return new_toJSON.call(this, original_toJSON)
      }
    }

    // Do we already have some associations?
    if (!blueprint.model.hasOwnProperty("associations")) {
      blueprint.model.associations = []
    }

    // Check for associations while this issue
    // is still happening. https://github.com/balderdashy/waterline/issues/797
    // Loop over the attributes to find any associations.
    for (const attribute in blueprint.model.attributes) {
      // Does it have a model or collection property?
      if (blueprint.model.attributes[attribute].hasOwnProperty("model") ||
        blueprint.model.attributes[attribute].hasOwnProperty("collection")) {
        // Add our new association.
        blueprint.model.associations.push({ alias: attribute })
      }
    }

    // Add multicolour as an accessible instance attribute
    // to our lifecycle callbacks so we can run other queries.
    blueprint.model.multicolour_instance = this.request("host")

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
    this.request("waterline").initialize(config, (err, ontology) => {
      if (err) {
        /* istanbul ignore next: Untestable */
        throw err
      }

      // Set the models on the database so we
      // can access them elsewhere in the codebase.
      this
        .set("models", ontology.collections)
        .set("connections", ontology.connections)

      callback(ontology)
    })
  }

  stop(cb) {
    return this.request("waterline").teardown(cb)
  }
}

// Export Multicolour_Waterline_Generator for Multicolour
// to register.
module.exports = Multicolour_Waterline_Generator
