module.exports = App => {

  server.register(bell, err => {
    if (err) throw err
    // Create an auth strategy.
    server.auth.strategy(App.config.auth.provider, 'bell', App.config.auth)
    server.auth.default(App.config.auth.provider)
  })

  App.server.route({
    method: [ 'GET', 'POST' ],
    path: '/login',
    config: {
      auth: App.config.auth.provider,
      handler: (request, reply) => reply(request.auth.credentials),
      description: format('Create a session using the provider "%s"', App.config.auth.provider),
      notes: 'Using the "bell" scheme create a session.',
      tags: [ 'api', 'session' ]
    }
  })
}
