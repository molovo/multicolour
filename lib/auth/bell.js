"use strict"

module.exports = App => {

  const bell = require("bell")

  App.server.register(bell, err => {
    if (err) {
      throw err
    }
    // Create an auth strategy.
    App.server.auth.strategy(App.config.auth.provider, "bell", App.config.auth)
    App.server.auth.default(App.config.auth.provider)
  })

  App.server.ext("onPreResponse", (request, reply) => {
    // Move on.
    reply.continue()
  })
}
