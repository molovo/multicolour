"use strict"

module.exports = {
  content: __dirname,

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
