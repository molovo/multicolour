"use strict"

module.exports = App => {

  App.server.register(require("bell"), err => {
    if (err) {
      throw err
    }
    // Create an auth strategy.
    App.server.auth.strategy(App.config.auth.provider, "bell", App.config.auth)
    App.server.auth.default(App.config.auth.provider)
  })
}
