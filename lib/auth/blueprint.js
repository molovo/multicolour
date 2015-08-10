'use strict'

module.exports = App => {

  const Waterline = require('waterline')

  const model = Waterline.Collection.extend({
    identity: 'rainbow_users',
    connection: process.env.RAIN_ENV || 'production',
    attributes: {
      username: {
        required: true,
        type: 'string'
      },
      password: {
        required: true,
        type: 'string'
      },
      salt: {
        required: true,
        type: 'string'
      }
    }
  })

  App.waterline.loadCollection(model)

  return model
}
