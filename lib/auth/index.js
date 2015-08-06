module.exports = App => {
  // Check we have an auth config block first.
  if (!App.config.auth) return App

  // What type of authentication are we talking about here?
  if (App.config.auth.provider === 'token') require('./jwt')(App)
  else require('./bell')(App)

  // App.server.ext('onPreResponse', (request, reply) => {
    // let parser = require('xml2json')
    // let data = parser.toJson(request.response.data)
    // reply.continue()
  // })
}
