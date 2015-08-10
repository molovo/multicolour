'use strict'

module.exports = App => {
  // Check we have an auth config block first.
  if (!App.config.auth) return App

  // Get the auth user model.
  require('./blueprint')(App)

  // For string formatting.
  const format = require('util').format

  // Get joi to validate the login endpoint.
  const joi    = require('joi')

  let module_name = './jwt'

  // What type of authentication are we talking about here?
  if (App.config.auth.provider !== 'token')
    module_name = './bell'

  // Get the module.
  let auth_module = require(module_name)(App)

  App.server.route({
    method: [ 'POST' ],
    path: '/login',
    config: {
      handler: (request, reply) => reply(request.auth.credentials),
      description: format('Create a session using the provider "%s"', App.config.auth.provider),
      notes: format('Using the "%s" scheme create a session.', App.config.auth.provider),
      tags: [ 'api', 'session' ],
      validate: {
        payload: {
          username : joi.string().required(),
          password : joi.string().required()
        }
      }
    }
  })

  return auth_module
}
