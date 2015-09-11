"use strict"

module.exports = App => {
  // Get the Hapi library so we can create a server,
  // register Hapi plugins, create routes and create
  // event listeners.
  const hapi = require("hapi")

  // Get the function templates for our routes.
  const functions = require("./templates")

  // Create the server.
  const server = new hapi.Server({
    connections: {
      routes: {
        security: true
      }
    }
  })

  // Configure the server.
  server.connection(App.config.http.api)

  // Add swagger docs.
  if (App.config.debug) {
    server.register([
      require("inert"),
      require("vision"),
      {
        register: require("hapi-swagger"),
        options: {
          apiVersion: App.config.version
        }
      }
    ], err => {
      if (err) {
        server.log(["error"], "hapi-swagger load error: " + err)
      }
      else {
        server.log(["start"], "hapi-swagger interface loaded")
      }
    })
  }

  return server
}
