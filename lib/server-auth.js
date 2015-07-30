module.exports = App => {
  // Check we have an auth config block first.
  if (!App.config.auth) return App

  // What type of authentication are we talking about here?
  switch (App.config.auth.provider) {
    case 'jwt':
      
    break
  }


  // App.server.ext('onPreResponse', (request, reply) => {
    // let parser = require('xml2json')
    // let data = parser.toJson(request.response.data)
    // reply.continue()
  // })

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
