// This is a library that does a heap of
// stuff for you automatically like generate
// Waterline collections, Hapi JS routes and
// Backbone models/collections/routes.
//
// Boot up the app.
'use strict'

const path      = require('path')
const Waterline = require('waterline')
const hapi      = require('hapi')
const format    = require('util').format
const bell      = require('bell')

// Get our utility to convert blueprints to joi models.
const bp_to_joi = require('./blueprint-to-joi')

// Get the user's configuration.
const rainbow_config = require('../../config')

// Get the function templates for our routes.
const functions = require('./templates')

// Create an app to put stuff.
let App = {
  config: rainbow_config,

  // Create an instance of Waterline.
  waterline: new Waterline(),

  // Create a collections set.
  collections: new Set(),

  // We'll store the blueprints.
  blueprints: new Set(),

  // Create the server.
  server: new hapi.Server()
}

// Configure the server.
App.server.connection(App.config.http.api)

// Add swagger docs.
if (App.config.debug) {
  App.server.register({
    register: require('hapi-swagger'),
    options: {
      apiVersion: require('../../package.json').version
    }
  }, err => {
    if (err) App.server.log(['error'], 'hapi-swagger load error: ' + err)
    else App.server.log(['start'], 'hapi-swagger interface loaded')
  })
}

if (App.config.auth) {
  App.server.register(bell, err => {
    if (err) throw err
    // Create an auth strategy.
    App.server.auth.strategy(App.config.auth.provider, 'bell', App.config.auth)
    App.server.auth.default(App.config.auth.provider)
  })
}

function slugifyUrl(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9]/g, '')
}

App.server.ext('onPreResponse', (request, reply) => {
  // let parser = require('xml2json')
  // let data = parser.toJson(request.response.data)
  reply.continue()
})

require('glob')(format('%s/blueprints/**/*.js', App.config.content || '../../content'), (err, files) => {
  if (err) throw err

  files
    // Fix the paths.
    .map(file_path => path.resolve(file_path))

    // Create the collections and change from file_paths to file_models.
    .map(file_path => {
      // Get the model
      let model = require(file_path)

      // Add the loaded blueprint.
      App.blueprints.add(model)

      // Create the collection
      let collection = Waterline.Collection.extend({
        identity: slugifyUrl(model.name || path.basename(file_path, '.js')),
        connection: process.env.RAIN_ENV || 'production',
        attributes: model.schematic
      })

      // Create the collection.
      App.collections.add(collection)

      // Load the model.
      App.waterline.loadCollection(collection)

      // Keep going
      return model
    })

  // Kick off Waterline.
  App.waterline.initialize(App.config.db, (err, models) => {
    if (err) throw err

    let endpoints = 0

    // Add the collections to the app for ORM doings.
    App.models = models.collections

    // If we have auth, set up a login endpoint.
    if (App.config.auth) {
      App.server.route({
        method: [ 'GET', 'POST' ],
        path: '/login',
        config: {
          auth: App.config.auth.provider,
          handler: (request, reply) => {
            reply(request.auth.credentials)
          },
          description: 'Create a session using the provider "%s"',
          notes: 'Using the "bell" scheme create a session.',
          tags: [ 'api', 'session' ]
        }
      })
    }

    // Create the routes.
    for (let model_name in App.models) {
      // Get the model name.
      let name = App.models[model_name].adapter.identity

      // Route the things.
      App.server.route([
        {
          method: 'GET',
          path: format('/%s/{id?}', name),
          config: {
            handler: () => functions.get.apply(App.models[model_name], arguments),
            description: format('Get %ss', name),
            notes: format('Return a paginated list of %ss in the database. If an ID is passed, return matching documents.', name),
            tags: [ 'api', name ]
          }
        },
        {
          method: 'POST',
          path: format('/%s', name),
          config: {
            handler: () => functions.create.apply(App.models[model_name], arguments),
            description: format('Create a new %s', name),
            notes: format('Create a new %s from the posted data.', name),
            tags: [ 'api', name ]
          }
        },
        {
          method: 'PUT',
          path: format('/%s/{id}', name),
          config: {
            handler: () => functions.update.apply(App.models[model_name], arguments),
            description: format('Update a %s', name),
            notes: format('Update a %s with the posted data.', name),
            tags: [ 'api', name ]
          }
        },
        {
          method: 'DELETE',
          path: format('/%s/{id}', name),
          config: {
            handler: () => functions.delete.apply(App.models[model_name], arguments),
            description: format('Delete a %s', name),
            notes: format('Delete a %s permanently.', name),
            tags: [ 'api', name ]
          }
        }
      ])

      endpoints += 4
    }

    // Kick off the http server.
    App.server.start(() => console.log('Rainbow API running on %s with %s endpoints.', App.server.info.uri, endpoints))
  })
})
