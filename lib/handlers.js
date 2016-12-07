"use strict"

// Get some tools.
const Http_Error = require("./http-error")
const Constraints = require("./constraints")

class Multicolour_Route_Templates {

  register(multicolour) {
    this.multicolour = multicolour

    multicolour.set("handlers", this)
  }

  /**
   * Return a boolean pertaining to whether this
   * collection has any associations or not.
   * @param  {Waterline.Collection} collection to check.
   * @return {Boolean} Whether or not this collection has any associations.
   */
  collection_has_associations(collection) {
    return Object.keys(collection._attributes)
      .filter(key => Boolean(collection._attributes[key].model || collection._attributes[key].collection)).length > 0
  }

  /**
   * Compile any constraints and return an object.
   * @param  {Hapi.Request} request to the server.
   * @param  {Waterline.Collection} collection to get constraints from.
   * @return {Object} compiled constraints.
   */
  compile_constraints(request, constraints) {
    // Exit if there aren't any constraints.
    if (!constraints) {
      return {}
    }

    return new Constraints()
      .set_source(request)
      .set_rules(constraints)
      .compile()
      .results
  }

  /**
   * Posted data implies asset creation, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  POST(model, request, callback) {
    // Start with the id.
    const qs = request.payload

    // Constraints on POST are pre-database checks
    // against the request.
    if (model.constraints && model.constraints.post) {
      const constraints = Multicolour_Route_Templates.compile_constraints.call(this, request, model.constraints.post)

      // Check our constraints.
      if (!Object.keys(constraints).every(key => request[key] !== constraints[key])) {
        return callback(new Http_Error("Constraints validation failed", 412), null, this)
      }
      else {
        Object.assign(qs, constraints)
      }
    }

    // Do the database work.
    model.create(qs, (err, models) => {
      if (err) {
        /* istanbul ignore next: Untestable */
        callback(err, null, this)
      }
      else {
        // Add the id to the params.
        request.params.id = models.id

        // Then pass that to the get function for the reply.
        this.GET(model, request, callback)
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
  GET(model, request, callback) {
    // Get the query string.
    const qs = request.url.query

    // How many results per page do we want?
    const per_page = this.multicolour.get("config").get("settings").results.per_page

    // Get which page we're on and remove the meta from the query.
    const page = Number(qs.page) - 1 || 0
    delete qs.page

    // Unless we"re passed an id, then find that one.
    if (request.params.id) {
      qs.id = request.params.id
    }

    // Compile constraints if there are any.
    if (model.constraints && model.constraints.get) {
      const constraints = Multicolour_Route_Templates.compile_constraints.call(this, request, model.constraints.get)

      // Extend the constraints onto the query.
      Object.assign(qs, constraints)
    }

    // Start building our query.
    const query = model.find(qs)

    // Paginate.
    if (typeof per_page !== "undefined" && per_page > 0) {
      query
        .skip(Math.abs(page * per_page))
        .limit(per_page)
    }

    // Populate any joins that might exist (attributes with the `model` property.)
    if (this.collection_has_associations(model)) {
      query.populateAll()
    }

    // Execute the query.
    query.exec((err, models) => {
      // Check for errors.
      if (err) {
        /* istanbul ignore next: Untestable */
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
  PATCH(model, request, callback) {
    // Start with the id.
    const qs = {id: request.params.id}

    // Compile constraints if there are any.
    if (model.constraints && model.constraints.patch) {
      const constraints = Multicolour_Route_Templates.compile_constraints.call(this, request, model.constraints.patch)

      // Extend the constraints onto the query.
      Object.assign(qs, constraints)
    }

    model.update(qs, request.payload, err => {
      if (err) {
        /* istanbul ignore next: Untestable */
        callback(err, null, model)
      }
      else {
        this.GET(model, request, callback)
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
  PUT(model, request, callback) {
    // Start with the id.
    const qs = {}

    // Did the client specify an id?
    if (request.params.id) {
      qs.id = request.params.id
    }

    // Compile constraints if there are any.
    if (model.constraints && model.constraints.put) {
      const constraints = Multicolour_Route_Templates.compile_constraints.call(this, request, model.constraints.put)

      // Extend the constraints onto the query.
      Object.assign(qs, constraints)
    }

    model.findOne(qs, (err, models) => {
      if (err) {
        /* istanbul ignore next: Untestable */
        callback(err, null, model)
      }
      else if (!models) {
        if (request.params.id) {
          request.payload.id = request.params.id
        }

        // Do the database work.
        model.create(request.payload, (err, models) => {
          if (err) {
            /* istanbul ignore next: Untestable */
            callback(err, null, this)
          }
          else {
            // Add the id to the params.
            request.params.id = models.id

            // Then pass that to the get function for the reply.
            this.GET(model, request, callback)
          }
        })
      }
      else {
        model.update(qs, request.payload, err => {
          if (err) {
            /* istanbul ignore next: Untestable */
            callback(err, null, this)
          }
          else {
            this.GET(model, request, callback)
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
  DELETE(model, request, callback) {
    // Start with the id.
    const qs = {id: request.params.id}

    // Compile constraints if there are any.
    if (model.constraints && model.constraints.delete) {
      const constraints = Multicolour_Route_Templates.compile_constraints.call(this, request, model.constraints.delete)

      // Extend the constraints onto the query.
      Object.assign(qs, constraints)
    }

    // Do the database work.
    model.findOne(qs, (err, models) => {
      if (err) {
        /* istanbul ignore next: Untestable */
        callback(err, null, model)
      }
      else if (!models) {
        callback(new Http_Error("Document(s) not found.", 410), null, model)
      }
      else {
        model.destroy(qs, err => {
          if (err) {
            /* istanbul ignore next: Untestable */
            callback(err, null, model)
          }
          else {
            callback(null, {id: qs.id}, model)
          }
        })
      }
    })
  }

  /**
   * Upload handler for creating media. This function is
   * called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  UPLOAD(model, request, callback) {
    // Start with the id.
    const qs = {id: request.params.id}

    // Compile constraints if there are any.
    if (model.constraints && model.constraints.post) {
      const constraints = Multicolour_Route_Templates.compile_constraints.call(this, request, model.constraints.post)

      // Extend the constraints onto the query.
      Object.assign(qs, constraints)
    }

    // Get the key we'll use to store the location.
    let key = model.can_upload_file

    // If it was just a boolean, use a default key.
    if (typeof model.can_upload_file === "boolean") {
      key = "file"
    }

    // Find the media data.
    model.findOne(qs, (err, models) => {
      // Check for errors.
      if (err) {
        /* istanbul ignore next: Untestable */
        callback(err, null, this)
      }
      // Check we found models.
      else if (!models) {
        callback(
          new Http_Error(`Upload failed, could not find the host document with the id "${request.params.id}".`, 404),
          null,
          this
        )
      }
      // Upload the file.
      else {
        // Get the target extension & name.
        const uuid = this.multicolour.request("new_uuid")
        const extension = require("path").extname(request.payload.file.filename).toLowerCase()
        const name = `${this.file_path || ""}${uuid}${extension}`

        // Get storage config.
        const storage_config_keys = this.multicolour.request("storage_config_keys")
        const storage_config = {name}

        // Get any config available from the model.
        if (storage_config_keys) {
          storage_config_keys.forEach(key => {
            storage_config[key] = this[key]
          })
        }

        // Upload the file.
        this.multicolour.request("storage")
          .upload(request.payload.file.path, storage_config)
            .stream
              /* istanbul ignore next: Untestable */
              .on("error", err => callback(err, null, this))
              .on("finish", () => {
                // Get the update attributes.
                const attributes = {
                  pending: false,
                  [key]: name
                }

                // Update the model and reply with the updated model.
                model.update({id: models.id}, attributes, err => {
                  if (err) {
                    /* istanbul ignore next: Untestable */
                    callback(err, null, this)
                  }
                  else {
                    this.GET(model, request, callback, 202)
                  }
                })
              })
      }
    })
  }
}

// Export the templates.
module.exports = Multicolour_Route_Templates
