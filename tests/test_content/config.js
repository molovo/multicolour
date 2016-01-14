"use strict"

module.exports = {
  // Where is your content? blueprints, etc
  content: `${__dirname}/`,

  // Set up our desired database adapter
  db: {
    adapters: {
      development: require("sails-memory")
    },
    connections: {
      development: {
        adapter: "development"
      }
    }
  }
}
