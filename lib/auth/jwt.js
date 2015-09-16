module.exports = (App) => {
  "use strict"

  // Register the JWT plugin.
  App.server.register(require("hapi-auth-jwt2"), error => {
    // Check for errors.
    if (error) {
      throw error
    }

    // Register the auth strategy.
    App.server.auth.strategy(App.config.auth.provider, "jwt", true, {
      // The private key in the config file.
      key: App.config.auth.privateKey,

      // Set the algorithm we want to use.
      verifyOptions: { algorithms: ["HS256"] },

      // The validation function.
      validateFunc: (decoded, request, callback) => {
        App.models.multicolour_users
          .findOne({ email: decoded.email })
          .exec((err, found_user) => {
            // Check for errors.
            if (err) {
              callback(err, false)
            }
            // Check we found a user and win.
            else if (found_user) {
              callback(null, true, { scope: found_user.role })
            }
            // Lose.
            else {
              callback(null, false)
            }
          })
      }
    })
  })
}
