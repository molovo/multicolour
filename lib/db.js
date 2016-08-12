"use strict"

// Get the tools.
const Waterline = require("waterline")
const debug = require("debug")

class Multicolour_Waterline_Generator extends Map {
  /**
   * Instantiated by Multicolour to create database models.
   * @return {Multicolour_Waterline_Generator} Multicolour_Waterline_Generator for chaining.
   */
  constructor() {
    // Construct.
    super()

    // Attach a debugger.
    this.debug = debug("multicolour:database")

    // Create the Waterline instance we'll register models with.
    const waterline = new Waterline()
    this.set("waterline", waterline)
    this.set("definitions", {})

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
          name: require("pluralize")(model.identity || path.basename(file_path, ".js"), 1),
          model: model
        }
      })

      // Register the definitions.
      .map(blueprint => {
        this.get("definitions")[blueprint.name] = blueprint.model
        return blueprint
      })

    return this
  }

  /**
   * Join two tables/collections together.
   * @param {Object} options to relate tables/collections.
   * @return {Multicolour_Waterline_Generator} Multicolour_Waterline_Generator for chaining.
   */
  join(options) {
    // Resolve the options.
    const as = options.as || `${options.from}_${options.to}`

    // Add the relationship.
    this.add_relation_to_collection(as, options.from, options.to, options.many)

    // Exit.
    return this
  }

  /**
   * Before a model is registered, we might
   * want to modify it based on some condition.
   *
   * It's not entirely recommended this be used at
   * all, most of the time you should write logic
   * to handle your data.
   *
   * @param  {String} collection_name being registered
   * @param  {Object} values of the collection
   * @return {Multicolour_Waterline_Generator} Object for chaining.
   */
  add_relation_to_collection(relationship_name, collection_name, relationship_collection, multiple) {
    const models = this.get("definitions")

    // Debugging.
    this.debug("Joining tables/collections %s to %s as %s", collection_name, relationship_collection, relationship_name)

    // Check the collection we're adding to exists.
    if (!models.hasOwnProperty(collection_name.toString())) {
      throw new ReferenceError(`No collection found named "${collection_name}"`)
    }

    // Check the target collection exists.
    if (!models.hasOwnProperty(relationship_collection.toString())) {
      throw new ReferenceError(`No collection found named "${relationship_collection}"`)
    }

    // Check nothing bad is going to happen.
    if (models[collection_name].attributes.hasOwnProperty(relationship_name)) {
      throw new TypeError(`The collection "${collection_name}" already has a relationship named "${relationship_name}".`)
    }

    // It's safe to add the relationship.
    models[collection_name].attributes[relationship_name.toString()] = {
      [multiple ? "collection" : "model"]: relationship_collection.toString()
    }

    // Put stuff back where we found it.
    this.set("definitions", models)

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
    const utils = require("./utils")

    // Get the object.
    let model = this.toObject()

    // Call the original toJSON method on the model.
    if (original && original instanceof Function) {
      model = original.call(this)
    }

    // Return the modified object.
    return utils.remove_null_undefined(model)
  }

  /**
   * Generate Waterline models from the blueprint JSON.
   * @param  {Object} blueprint to generate from.
   * @return {Waterline.Collection} generated Waterline Collection.
   */
  generate_model(blueprint) {
    // If it's the Endpoint class, rawify the model.
    if (blueprint.model.$_endpoint_class) {
      blueprint.model = blueprint.model.rawify()
    }

    // Default some values.
    blueprint.model.identity = blueprint.name
    blueprint.model.connection = blueprint.model.connection || this.request("host").get("env")
    blueprint.model.migrate = blueprint.model.migrate || process.env.NODE_ENV === "development" ? "alter" : "safe"

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

    // Debugging.
    this.debug("Registering generated model %s", blueprint.name)

    // Create the collection.
    return Waterline.Collection.extend(blueprint.model)
  }

  /**
   * Start the database connector.
   * @param  {Function} callback to pass to the underlying tech.
   * @return {void}
   */
  start(callback) {
    // Get the hsots.
    const multicolour = this.request("host")
    const waterline = this.get("waterline")

    /* istanbul ignore next */
    const config = multicolour.get("config").get("db") || {}
    /* istanbul ignore next */
    const env = this.request("host").get("env") || "production"

    // Generate the models.
    Object.keys(this.get("definitions"))
      .map(model_name => ({
        name: model_name,
        model: this.get("definitions")[model_name]
      }))

      .map(this.generate_model.bind(this))

      // Register them with Waterline.
      .map(waterline.loadCollection.bind(waterline))

    // Emit an event for database starting.
    multicolour.trigger("database_starting")

    // Get our connections.
    const connections = Object.assign({}, config.connections)

    // Remove the environments.
    delete config.connections.production
    delete config.connections.development

    // Re-apply the correct environment
    config.connections[env] = connections[env]

    // Debugging.
    this.debug("Starting database with %s", JSON.stringify(config, null, 2))

    // Try to start Waterline.
    this.get("waterline").initialize(config, (err, ontology) => {
      if (err) {
        /* istanbul ignore next: Untestable */
        return callback(err)
      }

      // Set the models on the database so we
      // can access them elsewhere in the codebase.
      this
        .set("models", ontology.collections)
        .set("connections", ontology.connections)

      // Emit an event for database starting.
      multicolour.trigger("database_started")

      // Run the callback.
      callback && callback(null, ontology)
    })
  }

  stop(cb) {
    let did_error = false
    try {
      this.get("waterline").teardown(() => {})
      did_error = false
    }
    catch(error) {
      /* istanbul ignore next : Untestable */
      cb(error)
      /* istanbul ignore next : Untestable */
      did_error = true
    }
    finally {
      if (!did_error) {
        cb && cb()
      }
    }

    return this
  }
}

// Export Multicolour_Waterline_Generator for Multicolour
// to register.
module.exports = Multicolour_Waterline_Generator
