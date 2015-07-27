'use strict'

// Get the Hapi library so we can create a server,
// register Hapi plugins, create routes and create
// event listeners.
const hapi = require('hapi')

// Auth with OAuth
const bell = require('bell')

// Get the function templates for our routes.
const functions = require('./templates')

// Get our config.
const program = require('./cli')
const config = program.config

// Create the server.
const server = new hapi.Server()

// Configure the server.
server.connection(config.http.api)

// Add swagger docs.
if (config.debug) {
  server.register({
    register: require('hapi-swagger'),
    options: {
      apiVersion: program._version
    }
  }, err => {
    if (err) server.log(['error'], 'hapi-swagger load error: ' + err)
    else server.log(['start'], 'hapi-swagger interface loaded')
  })
}

if (config.auth) {
  server.register(bell, err => {
    if (err) throw err
    // Create an auth strategy.
    server.auth.strategy(config.auth.provider, 'bell', config.auth)
    server.auth.default(config.auth.provider)
  })
}


// Export the server.
module.exports = server
