'use strict'
// I'm not adding an abstraction layer on top of another abstraction
// layer, I'm simply tieing things together to make your life better.
//
// All options below are passed directly to the awesome
// software behind this all. This is all just glue and generators.

// Get the path library to resolve where the content is.
const path = require('path')

module.exports = {
  // Where is your content? blueprints, assets, themes, etc
  content: path.join(__dirname, '/content'),

  // Are you developing? true or false
  debug: process.env.NODE_ENV !== 'production',

  // Our API will be auth protected.
  // auth: {
  //   provider: 'token',
  //   privateKey: require('crypto').createDiffieHellman(600).generateKeys('base64')
  // },

  // Configure our servers, api and frontend.
  http: {
    // Configures the REST server.
    api: {
      host: 'localhost',
      port: 1811,
      routes: {
        cors: true
      },
      router: {
        stripTrailingSlash: true
      }
    },

    // Configure the front end server.
    frontend: {
      host: 'localhost'
    }
  },

  // Set up our desired database adapter (defaults to Mongo)
  db: {
    adapters: {
      production: require('sails-mongo')
    },
    connections: {
      production: {
        adapter: 'production',
        host: 'localhost',
        port: 27017,
        // username: 'username',
        // password: 'password',
        database: 'rainbow_test'
      }
    }
  }
}
