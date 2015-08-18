module.exports = (App, user_model) => {
  // Get JWT.
  const jwt = require('jsonwebtoken')

  // Register the JWT plugin.
  App.server.register(require('hapi-auth-jwt2'), error => {
    // Check for errors.
    if (error) throw error

    // Register the auth strategy.
    App.server.auth.strategy('token', 'jwt', {
      // The private key in the config file.
      key: App.config.auth.privateKey,

      // Set the algorithm we want to use.
      verifyOptions: { algorithms: [ 'HS256' ] },

      // The validation function.
      validateFunc: (decoded, callback) => {
        console.log('DECODED', decoded, callback)

        callback(null, true, { name: 'dave', pass: 'pass' })
      }
    })
  })

  return (req, reply) => {
    reply.continue()
  }
}
