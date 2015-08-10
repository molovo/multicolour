module.exports = App => {
  // Get JWT.
  const jwt = require('jsonwebtoken')

  App.server.register(require('hapi-auth-jwt'), function (error) {
    App.server.auth.strategy('token', 'jwt', {
        key: App.config.auth.privateKey,
        validateFunc: (decoded, callback) => {
          console.log(decoded)

          callback(null, true, { name: 'dave', pass: 'pass' })
        }
    })
  })

  return {
    onPreResponse: request => {

    }
  }
}
