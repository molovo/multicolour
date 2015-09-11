"use strict"

module.exports = App => {
  // Check we have an auth config block first.
  if (!App.config.auth) {
    return App
  }

  // Get the auth user model.
  require("./blueprint")(App)

  // Get joi to validate the login endpoint.
  const joi = require("joi")

  let module_name = "./jwt"

  // What type of authentication are we talking about here?
  if (App.config.auth.provider !== "token") {
    module_name = "./bell"
  }

  // Get the module.
  require(module_name)(App)

  App.server.route([
    {
      method: "POST",
      path: "/session",
      config: {
        handler: (request, reply) => reply({ creds: request.auth.credentials }),
        description: `Create a session using the provider "${App.config.auth.provider}"`,
        notes: `Using the "${App.config.auth.provider}" scheme to create a session.`,
        tags: ["api", "session"],
        validate: {
          payload: {
            username: joi.string().required(),
            password: joi.string().required()
          }
        }
      }
    }
  ])
}
