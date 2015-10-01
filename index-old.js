// This is a library that does a heap of
// stuff for you automatically like generate
// Waterline collections, Hapi JS routes and
// Backbone models/collections/routes.
"use strict"

// Boot up the app.
const program = require("./lib/cli")

// If we're not starting the servers, stop here.
if (program.start) {

  const path = require("path")
  const Waterline = require("waterline")
  const Joi = require("joi")
  const pluralize = require("pluralize")

  // Get the function templates for our routes.
  const functions = require("./lib/templates")

  // Get our utility to convert blueprints to joi models.
  const bp_to_joi = require("./lib/blueprint-to-joi")

  // Get our config.
  const config = program.config

  // Create an app to put stuff.
  const App = {
    config: config,

    // Count the number of endpoints.
    endpoint_total: 0,

    // Create an instance of Waterline.
    waterline: new Waterline(),

    // Create a collections set.
    collections: new Set(),

    // We"ll store the blueprints.
    blueprints: new Map()
  }

  // Get the server.
  App.server = require("./lib/server")(App)

  /**
   * Make the name sane and safe.
   *
   * @param  {String} name to make safe for a slug.
   * @return {String} Safe name to use in urls and databases.
   */
  function slugifyUrl(name) {
    return pluralize(name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9]/g, ""), 1)
  }

  // Start reading the blueprints in.
  require("glob")(`${App.config.content}/blueprints/**/*.js` || "../../content", (err, files) => {
    if (err) {
      throw err
    }

    // Load the users blueprint.
    require("./lib/auth/blueprint")(App)

    files
      // Fix the paths.
      .map(file_path => path.resolve(file_path))

      // Create the collections and change from file_paths to file_models.
      .map(file_path => {
        // Get the model
        const model = require(file_path)
        const name = slugifyUrl(model.name || path.basename(file_path, ".js"))

        // If we have a blueprint, set it up with Waterline.
        if (model.hasOwnProperty("blueprint")) {
          // Add the loaded blueprint.
          App.blueprints.set(name, model)

          // Create the collection
          const collection = Waterline.Collection.extend({
            identity: name,
            connection: process.env.NODE_ENV || "production",
            attributes: model.blueprint
          })

          // Create the collection.
          App.collections.add(collection)

          // Load the model.
          App.waterline.loadCollection(collection)
        }

        // Keep going.
        return model
      })

      // If the model specifies any routes, register them with Hapi.
      .map(file_model => {
        if (file_model.hasOwnProperty("routes") && file_model.routes.length > 0) {
          // Get the length of the routes and add to the endpoint count.
          App.endpoint_total += file_model.routes.length

          // Register the routes.
          App.server.route(file_model.routes)
        }

        return file_model
      })

    // Kick off Waterline.
    App.waterline.initialize(App.config.db, (error, models) => {
      if (error) {
        throw error
      }

      // Add the collections to the app for ORM doings.
      App.models = models.collections

      // If we enabled auth, register the plugin
      // and set up the validateFuncs.
      if (App.config.auth) {
        require("./lib/auth")(App)
      }

      // Create the routes.
      for (const model_name in App.models) {
        // Get the model name.
        const name = App.models[model_name].adapter.identity

        // Check we're not picking up stuff we shouldn"t,
        // if we are just continue with the next iteration.
        if (!App.blueprints.get(model_name)) {
          continue
        }

        // Generate a schema to validate payloads against.
        const joi_schema = bp_to_joi(App.blueprints.get(model_name).blueprint)

        let auth_options = {
          strategy: App.config.auth ? App.config.auth.provider : false,
          scope: ["user", "admin"]
        }

        // If no auth is desired, wipe the options.
        if (!App.config.auth) {
          auth_options = false
        }

        // Route the things.
        App.server.route([
          {
            method: "GET",
            path: `/${name}/{id?}`,
            config: {
              auth: auth_options,
              handler: functions.get.bind(App.models[model_name]),
              description: `Get a paginated list of "${name}"`,
              notes: `Return a list of "${name}" in the database. If an ID is passed, return matching documents.`,
              tags: ["api", name],
              validate: {
                params: Joi.object({
                  id: Joi.string().optional()
                })
              },
              response: {
                schema: Joi.array().items(joi_schema.get)
                  .meta({
                    className: `Get ${name}`
                  })
              }
            }
          },
          {
            method: "POST",
            path: `/${name}`,
            config: {
              auth: auth_options,
              handler: functions.create.bind(App.models[model_name]),
              description: `Create a new ${name}`,
              notes: `Create a new ${name} with the posted data.`,
              tags: ["api", name],
              validate: {
                payload: joi_schema.post
              },
              response: {
                schema: joi_schema.get.meta({
                  className: `Create ${name}`
                })
              }
            }
          },
          {
            method: "PUT",
            path: `/${name}/{id}`,
            config: {
              auth: auth_options,
              handler: functions.update.bind(App.models[model_name]),
              description: `Update a ${name}`,
              notes: `Update a ${name} with the posted data.`,
              tags: ["api", name],
              validate: {
                payload: joi_schema.put,
                params: Joi.object({
                  id: Joi.string().required()
                })
              },
              response: {
                schema: Joi.array().items(joi_schema.get).meta({
                  className: `Update ${name}`
                })
              }
            }
          },
          {
            method: "DELETE",
            path: `/${name}/{id}`,
            config: {
              auth: auth_options,
              handler: functions.delete.bind(App.models[model_name]),
              description: `Delete a ${name}`,
              notes: `Delete a ${name} permanently.`,
              tags: ["api", name],
              validate: {
                params: Joi.object({
                  id: Joi.string().required()
                })
              }
            }
          }
        ])



        App.endpoint_total += 4
      }

      // Kick off the http server.
      App.server.start(() => console.log("Multicolour API running on %s with %s endpoints.", App.server.info.uri, App.endpoint_total))
    })
  })

  module.exports = App
}
