module.exports = App => {

  server.register(bell, err => {
    if (err) throw err
    // Create an auth strategy.
    server.auth.strategy(App.config.auth.provider, 'bell', App.config.auth)
    server.auth.default(App.config.auth.provider)
  })

  App.server.ext('onPreResponse', (request, reply) => {
    // Fire the onPreResponse on the auth module.
    auth_module.onPreResponse(request)

    // Move on.
    reply.continue()
  })
}
