"use strict"

module.exports = (App) => {
  // Register the JWT plugin.
  App.server.register(require("hapi-auth-jwt2"), error => {
    // Check for errors.
    if (error) {
      throw error
    }

    // Register the auth strategy.
    App.server.auth.strategy(App.config.auth.provider, "jwt", true,
      {
        // The private key in the config file.
        key: App.config.auth.privateKey,

        // Set the algorithm we want to use.
        verifyOptions: { algorithms: ["HS256"] },

        // The validation function.
        validateFunc: (decoded, request, callback) => {
          console.log(decoded)
          App.models.multicolour_users
            .findOne({ email: decoded.email, session_key: decoded.token })
            .exec((err, models) => {
              console.log(models)
              // console.log(err, models)
              if (err) {
                callback(err, false)
              }
              else if (models) {
                callback(null, true)
              }
              else {
                callback(null, false)
              }
            })
        }
      })
  })
}
