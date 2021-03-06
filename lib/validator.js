"use strict"

// Get the tools.
const waterline_joi = require("waterline-joi")
const Joi = require("joi")

// Does the attribute have a model or collection property?
const attribute_is_related = attribute => attribute.hasOwnProperty("model") || attribute.hasOwnProperty("collection")

// Does a model have any relationships at all?
const model_has_relationships = model =>
  Object.keys(model).map(attribute => attribute_is_related(model[attribute])).length > 0


class Multicolour_Default_Validation {

  constructor() {
    this.schemas = {
      post: {},
      get: {},
      put: {},
      patch: {},
      delete: {}
    }

    this.error_schema = Joi.object({
      code: Joi.number(),
      error: Joi.string(),
      message: Joi.string()
    }).unknown(true)
  }

  /**
   * Get the schema for write operations, we have to make two passes.
   * The first pass generates the payloads for each defined model
   * and the second applies any related models payloads.
   *
   * @param  {Waterline.Collection} collection to get payload for.
   * @return {Joi.Schema} Schema for any requests.
   */
  generate_schemas(verb) {
    // Get the model definitions.
    const collections = this.multicolour.get("database").get("definitions")

    // First pass, create basic payloads.
    Object.keys(collections).forEach(collection_name => {
      this.schemas[verb][collection_name] = waterline_joi(collections[collection_name].attributes, false)

      // If it's an update endpoint, make all fields optional.
      if (verb === "put" || verb === "patch") {
        Object.keys(this.schemas[verb][collection_name])
          .forEach(joi_object => {
            this.schemas[verb][collection_name][joi_object] = this.schemas[verb][collection_name][joi_object].optional()
          })
      }

      // If a writable schema wasn't requested,
      // add the id and createdAt and updatedAt.
      if (verb === "get") {
        this.schemas[verb][collection_name].id = Joi.any()
        this.schemas[verb][collection_name].createdAt = Joi.any()
        this.schemas[verb][collection_name].updatedAt = Joi.any()
      }
    })

    // Second pass, make related payloads.
    Object.keys(collections)
      // Only get models with defined relationships.
      .filter(collection_name => model_has_relationships(collections[collection_name].attributes))

      // Add the schema to them.
      .forEach(collection_name => {
        const attributes = Object.assign({}, collections[collection_name].attributes)

        Object.keys(attributes)
          // Get an array of related attributes.
          .filter(attribute => attribute_is_related(attributes[attribute]))

          // Loop over them.
          .forEach(attribute => {
            // The target collection name.
            const target = attributes[attribute].collection || attributes[attribute].model

            // The collection to modify.
            const collection = this.schemas[verb][collection_name]

            // What schema to set the validation key to.
            let set_to = this.schemas[verb][target]

            // If it's a writable schema, add an id property.
            if (verb !== "get")
              set_to.id = Joi.alternatives().try(Joi.number(), Joi.string()).optional()

            // Add the relation.
            if (attributes[attribute].model)
              collection[attribute] = Joi.alternatives().try(set_to, Joi.number(), Joi.string())
            else if (attributes[attribute].collection)
              collection[attribute] = Joi.alternatives().try(
                Joi.array().items(set_to),
                Joi.array().items(Joi.number()),
                Joi.array().items(Joi.string())
              ).optional()
          })
      })

    return this
  }

  /**
   * Register with the server properties required by this plugin.
   * @param  {Multicolour_Server_Hapi} server to register to.
   * @return {void}
   */
  register(multicolour) {
    this.multicolour = multicolour

    // Create the verbs.
    const verbs = ["post", "get", "put", "patch", "delete"]
    verbs.forEach(this.generate_schemas.bind(this))

    // Add this validator to the list.
    multicolour.get("validators").set("application/json", this)
  }
}

// Export the plugin.
module.exports = Multicolour_Default_Validation
