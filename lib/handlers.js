"use strict"

// Get some tools.
const extend = require("util")._extend
const Http_Error = require("./http-error")

// Host will be set elsewhere.
let host = null

class Multicolour_Route_Templates {

  /**
   * Set the multicolour instance for binding.
   * @param {multicolour} target_host for binding.
   * @return {multicolour} host for binding.
   */
  static set_host(target_host) {
    host = target_host
    return host
  }

  static collection_has_associations(collection) {
    return Object.keys(collection._attributes)
      .filter(key => !!(collection._attributes[key].model || collection._attributes[key].collection)).length > 0
  }

  /**
   * Compile any constraints and return an object.
   * @param  {Hapi.Request} request to the server.
   * @param  {Waterline.Collection} collection to get constraints from.
   * @return {Object} compiled constraints.
   */
  static compile_constraints(request, constraints) {
    // Exit if there aren't any constraints.
    if (!constraints) {
      return {}
    }

    // Get the library.
    const jsocrud = require("jsocrud")

    // The query.
    const query = {}

    // Loop over each constraint and compile it's path.
    Object.keys(constraints).forEach(key =>
      query[key] = jsocrud.get(request, constraints[key], null))

    return query
  }

  /**
   * Posted data implies asset creation, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static POST(request, callback) {
    // Start with the id.
    const qs = request.payload

    // Constraints on POST are pre-database checks
    // against the request.
    if (this.constraints && this.constraints.post) {
      const constraints = Multicolour_Route_Templates.compile_constraints(request, this.constraints.post)

      // Check our constraints.
      if (!Object.keys(constraints).every(key => request[key] !== constraints[key])) {
        return callback(new Http_Error("Constraints validation failed", 412), null, this)
      }
    }

    // Do the database work.
    this.create(qs, (err, model) => {
      if (err) {
        callback(err, null, this)
      }
      else {
        // Add the id to the params.
        request.params.id = model.id

        // Then pass that to the get function for the reply.
        Multicolour_Route_Templates.GET.call(this, request, callback, 202)
      }
    })
  }

  /**
   * Get an asset, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static GET(request, callback) {
    // Get the query string.
    const qs = request.url.query

    // How many results per page do we want?
    const per_page = host.get("config").get("settings").results.per_page

    // Get which page we're on and remove the meta from the query.
    const page = Number(qs.page) - 1 || 0
    delete qs.page

    // Unless we"re passed an id, then find that one.
    if (request.params.id) {
      qs.id = request.params.id
    }

    // Compile constraints if there are any.
    if (this.constraints && this.constraints.get) {
      const constraints = Multicolour_Route_Templates.compile_constraints(request, this.constraints.get)

      // Extend the constraints onto the query.
      extend(qs, constraints)
    }

    // Start building our query.
    const query = this.find(qs)

    // Paginate.
    if (typeof per_page !== "undefined" && per_page > 0) {
      query
        .skip(Math.abs(page * per_page))
        .limit(per_page)
    }

    // Populate any joins that might exist (attributes with the `model` property.)
    if (Multicolour_Route_Templates.collection_has_associations(this)) {
      query.populateAll()
    }

    // Execute the query.
    query.exec((err, models) => {
      // Check for errors.
      if (err) {
        callback(err, null, this)
      }
      // If we had an id but nothing was found, 404.
      else if (qs.id && models.length === 0) {
        callback(new Http_Error("Document(s) not found.", 404), null, this)
      }
      // Reply with the models.
      else {
        callback(null, models.map(model => model.toJSON()), this)
      }
    })
  }

  /**
   * Patch data implies asset update, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static PATCH(request, callback) {
    // Start with the id.
    const qs = { id: request.params.id }

    // Compile constraints if there are any.
    if (this.constraints && this.constraints.patch) {
      const constraints = Multicolour_Route_Templates.compile_constraints(request, this.constraints.patch)

      // Extend the constraints onto the query.
      extend(qs, constraints)
    }

    this.update(qs, request.payload, err => {
      if (err) {
        callback(err, null, this)
      }
      else {
        Multicolour_Route_Templates.GET.call(this, request, callback)
      }
    })
  }

  /**
   * Put data implies asset replacement, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static PUT(request, callback) {
    // Start with the id.
    const qs = {}

    // Did the client specify an id?
    if (request.params.id) {
      qs.id = request.params.id
    }

    // Compile constraints if there are any.
    if (this.constraints && this.constraints.put) {
      const constraints = Multicolour_Route_Templates.compile_constraints(request, this.constraints.put)

      // Extend the constraints onto the query.
      extend(qs, constraints)
    }

    this.findOne(qs, (err, model) => {
      if (err) {
        callback(err, null, this)
      }
      else if (!model) {
        if (request.params.id) {
          request.payload.id = request.params.id
        }

        // Do the database work.
        this.create(request.payload, (err, model) => {
          if (err) {
            callback(err, null, this)
          }
          else {
            // Add the id to the params.
            request.params.id = model.id

            // Then pass that to the get function for the reply.
            Multicolour_Route_Templates.GET.call(this, request, callback)
          }
        })
      }
      else {
        this.update(model, request.payload, err => {
          if (err) {
            callback(err, null, this)
          }
          else {
            Multicolour_Route_Templates.GET.call(this, request, callback)
          }
        })
      }
    })
  }

  /**
   * Delete implies permanent asset destruction, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static DELETE(request, callback) {
    // Start with the id.
    const qs = { id: request.params.id }

    // Compile constraints if there are any.
    if (this.constraints && this.constraints.delete) {
      const constraints = Multicolour_Route_Templates.compile_constraints(request, this.constraints.delete)

      // Extend the constraints onto the query.
      extend(qs, constraints)
    }

    // Do the database work.
    this.destroy(qs, err => err ? callback(err, this) : callback({ id: request.params.id }, this))
  }

  /**
   * Upload handler for creating media. This function is
   * called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static UPLOAD(request, callback) {
    // Start with the id.
    const qs = { id: request.params.id }

    // Compile constraints if there are any.
    if (this.constraints && this.constraints.post) {
      const constraints = Multicolour_Route_Templates.compile_constraints(request, this.constraints.post)

      // Extend the constraints onto the query.
      extend(qs, constraints)
    }

    // Get the key we'll use to store the location.
    let key = this.can_upload_file

    // If it was just a boolean, use a default key.
    if (typeof this.can_upload_file === "boolean") {
      key = "file"
    }

    // Find the media data.
    this.findOne(qs, (err, model) => {
      // Check for errors.
      if (err) {
        callback(err, null, this)
      }
      // Check we found models.
      else if (!model) {
        callback(
          new Http_Error(`Upload failed, could not find the host document with the id "${request.params.id}".`, 404),
          null,
          this
        )
      }
      // Upload the file.
      else {
        // Get the target extension & name.
        const uuid = host.request("new_uuid")
        const extension = require("path").extname(request.payload.file.filename).toLowerCase()
        const name = `${this.file_path || ""}${uuid}${extension}`

        // Get storage config.
        const storage_config_keys = host.request("storage_config_keys")
        const storage_config = { name }

        // Get any config available from the model.
        if (storage_config_keys) {
          storage_config_keys.forEach(key => {
            storage_config[key] = this[key]
          })
        }

        // Upload the file.
        host.request("storage")
          .upload(request.payload.file.path, storage_config)
          .on("error", err => callback(err, null, this))
          .on("end", () => {
            // Get the update attributes.
            const attributes = {
              pending: false,
              [key]: name
            }

            // Update the model and reply with the updated model.
            this.update({ id: model.id }, attributes, err => {
              if (err) {
                callback(err, null, this)
              }
              else {
                Multicolour_Route_Templates.GET.call(this, request, callback, 202)
              }
            })
          })
      }
    })
  }
}

// Export the templates.
module.exports = Multicolour_Route_Templates
