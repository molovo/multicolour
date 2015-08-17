'use strict'

module.exports = App => {

  const Waterline = require('waterline')
  const functions = require('../templates')

  const model = Waterline.Collection.extend({
    identity: 'rainbow_users',
    connection: process.env.RAIN_ENV || 'production',
    attributes: {
      email: {
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
      },
      role: {
        required: true,
        type: 'string',
        default: 'user'
      }
    }
  })

  App.waterline.loadCollection(model)

  return model
}
