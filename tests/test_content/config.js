"use strict"

module.exports = {
  content: __dirname,

  http_port: 8576,

  db: {
    adapters: {
      memory: require("sails-memory")
    },
    connections: {
      development: {
        adapter: "memory"
      }
    }
  }
}
