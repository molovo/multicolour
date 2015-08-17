module.exports = (App, user_model) => {
  // Get JWT.
  const jwt = require('jsonwebtoken')

  App.server.register(require('hapi-auth-jwt'), error => {
    App.server.auth.strategy('token', 'jwt', {
        key: App.config.auth.privateKey,
        validateFunc: (decoded, callback) => {
          console.log('DECODED', decoded)
          // user_model.find()

          callback(null, false, { name: 'dave', pass: 'pass' })
        }
    })
  })

  return () => {}
}
