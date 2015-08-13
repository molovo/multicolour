// This is a library that does a heap of
// stuff for you automatically like generate
// Waterline collections, Hapi JS routes and
// Backbone models/collections/routes.
//
// Boot up the app.
'use strict'

const program = require('./lib/cli')

// If we're not starting the servers, stop here.
if (!program.start) return

const path      = require('path')
const Waterline = require('waterline')
const hapi      = require('hapi')
const format    = require('util').format
const bell      = require('bell')
const Joi       = require('joi')

// Get the function templates for our routes.
const functions = require('./lib/templates')

// Get our utility to convert blueprints to joi models.
const bp_to_joi = require('./lib/blueprint-to-joi')

// Get our config.
const config = program.config

// Create an app to put stuff.
let App = {
  config: config,

  // Count the number of endpoints.
  endpoint_total: 0,

  // Create an instance of Waterline.
  waterline: new Waterline(),

  // Create a collections set.
  collections: new Set(),

  // We'll store the blueprints.
  blueprints: new Map()
}

// Get the server.
App.server = require('./lib/server')(App)

if (App.config.auth)
  require('./lib/auth')(App)

function slugifyUrl(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9]/g, '')
}

require('glob')(format('%s/blueprints/**/*.js', App.config.content || '../../content'), (err, files) => {
  if (err) throw err

  files
    // Fix the paths.
    .map(file_path => path.resolve(file_path))

    // Create the collections and change from file_paths to file_models.
    .map(file_path => {
      // Get the model
      let model = require(file_path)
      const name = slugifyUrl(model.name || path.basename(file_path, '.js'))

      // If we have a blueprint, set it up with Waterline.
      if (model.hasOwnProperty('blueprint')) {
        // Add the loaded blueprint.
        App.blueprints.set(name, model)

        // Create the collection
        let collection = Waterline.Collection.extend({
          identity: name,
          connection: process.env.NODE_ENV || 'production',
          attributes: model.blueprint
        })

        // Create the collection.
        App.collections.add(collection)

        // Load the model.
        App.waterline.loadCollection(collection)
      }

      // Keep going
      return model
    })
    // If the model specifies any routes, register them with Hapi.
    .map(file_model => {
      if (file_model.hasOwnProperty('routes') && file_model.routes.length > 0) {
        // Get the length of the routes and add to the endpoint count.
        App.endpoint_total += file_model.routes.length

        // Register the routes.
        App.server.route(file_model.routes)
      }

      return file_model
    })

  // Kick off Waterline.
  App.waterline.initialize(App.config.db, (err, models) => {
    if (err) throw err

    // Add the collections to the app for ORM doings.
    App.models = models.collections

    // Create the routes.
    for (let model_name in App.models) {
      // Get the model name.
      let name = App.models[model_name].adapter.identity

      // Check we're not picking up stuff we shouldn't,
      // if we are just continue with the next iteration.
      if (!App.blueprints.get(model_name)) continue

      // Generate a schema to validate payloads against.
      let joi_schema = bp_to_joi(App.blueprints.get(model_name).blueprint)

      // Route the things.
      App.server.route([
        {
          method: 'GET',
          path: format('/%s/{id?}', name),
          config: {
            auth: App.config.auth ? App.config.auth.token : undefined,
            handler: () => functions.get.apply(App.models[model_name], arguments),
            description: format('Get a list of "%s"', name),
            notes: format('Return a paginated list of "%s" in the database. If an ID is passed, return matching documents.', name),
            tags: [ 'api', name ],
            validate: {
              params: Joi.object({
                id: Joi.string().optional()
              })
            },
            response: {
              schema: Joi.array().items(joi_schema.out)
                .meta({
                  className: format('Get %s', name)
                })
            }
          }
        },
        {
          method: 'POST',
          path: format('/%s', name),
          config: {
            auth: App.config.auth ? App.config.auth.token : undefined,
            handler: () => functions.create.apply(App.models[model_name], arguments),
            description: format('Create a new %s', name),
            notes: format('Create a new %s with the posted data.', name),
            tags: [ 'api', name ],
            validate: {
              payload: joi_schema.in
            },
            response: {
              schema: joi_schema.out.meta({
                className: format('Create %s', name)
              })
            }
          }
        },
        {
          method: 'PUT',
          path: format('/%s/{id}', name),
          config: {
            auth: App.config.auth ? App.config.auth.token : undefined,
            handler: () => functions.update.apply(App.models[model_name], arguments),
            description: format('Update a %s', name),
            notes: format('Update a %s with the posted data.', name),
            tags: [ 'api', name ],
            validate: {
              payload: joi_schema.in,
              params: Joi.object({
                id: Joi.string().required()
              })
            },
            response: {
              schema: joi_schema.out.meta({
                  className: format('Update %s', name)
                })
            }
          }
        },
        {
          method: 'DELETE',
          path: format('/%s/{id}', name),
          config: {
            auth: App.config.auth ? App.config.auth.token : undefined,
            handler: () => functions.delete.apply(App.models[model_name], arguments),
            description: format('Delete a %s', name),
            notes: format('Delete a %s permanently.', name),
            tags: [ 'api', name ],
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
    App.server.start(() => console.log('Multicolour API running on %s with %s endpoints.', App.server.info.uri, App.endpoint_total))
  })
})

module.exports = App
