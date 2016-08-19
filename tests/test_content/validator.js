"use strict"

// Get the tools.
const waterline_joi = require("waterline-joi")
const Joi = require("joi")

class Multicolour_Default_Validation {

  /**
   * Get the read only schema for a collection.
   * @param  {Waterline.Collection} collection to get payload for.
   * @return {Joi.Schema} Schema for any requests.
   */
  get_response_schema(collection) {
    // Get the base payload.
    const payload = waterline_joi(collection._attributes)

    // Generate a Joi schema from a fixed version of the attributes.
    return Joi.alternatives().try(
      Joi.array().items(payload),
      payload
    )
  }

  get_error_schema() {
    return Joi.array()
  }

  /**
   * Get the schema for write operations.
   * @param  {Waterline.Collection} collection to get payload for.
   * @return {Joi.Schema} Schema for any requests.
   */
  get_payload_schema(collection) {
    // Get our tools.
    const attributes = collection._attributes

    // Extend our attributes over some Waterline defaults.
    const schema = Object.assign({
      id: collection._attributes.id,
      createdAt: collection._attributes.createdAt,
      updatedAt: collection._attributes.updatedAt
    }, attributes)

    // Return the schema.
    return waterline_joi(schema)
  }

  /**
   * Register with the server properties required by this plugin.
   * @param  {Multicolour_Server_Hapi} server to register to.
   * @return {void}
   */
  register(server) {
    // Add this validator to the list.
    server.get("validators").push(this)

    server
      .reply("response_schema", this.get_response_schema.bind(this))
      .reply("payload_schema", this.get_payload_schema.bind(this))
  }
}

// Export the plugin.
module.exports = Multicolour_Default_Validation
