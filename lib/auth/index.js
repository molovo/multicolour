"use strict"

module.exports = App => {
  // Check we have an auth config block first.
  if (!App.config.auth) {
    return App
  }

  const utils = require("./utils")

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
        auth: false,
        handler: (request, reply) => {
          const jwt = require("jsonwebtoken")

          App.models.multicolour_users
            .findOne({ email: request.payload.email })
            .exec((err, found_user) => {
              // Check for errors.
              if (err) {
                reply(err)
              }
              // Check we found a user at all.
              else if (!found_user) {
                reply({ success: false })
              }
              // Check the password.
              else if (!found_user.password === utils.encrypt(request.payload.password, found_user.salt)) {
                reply({ success: false })
              }
              // Winning.
              else {
                // Sign the object.
                const user = require("util")._extend(found_user, {})

                // Delete private properties.
                delete user.password
                delete user.salt

                // Sign the package.
                const signed_payload = jwt.sign(user, App.config.auth.privateKey, {
                  // Expire in a week.
                  expiresInMinutes: 10080
                })

                reply({
                  success: true,
                  token: signed_payload
                })
                  .header("Authorization", signed_payload)
              }
            })
        },
        description: `Create a session using the provider "${App.config.auth.provider}"`,
        notes: `Using the "${App.config.auth.provider}" scheme to create a session.`,
        tags: ["api", "session"],
        validate: {
          payload: {
            email: joi.string().email().required(),
            password: joi.string().required()
          }
        }
      }
    }
  ])
}
