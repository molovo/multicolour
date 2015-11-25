"use strict"

module.exports = {
  attributes: {
    name: {
      required: true,
      type: "string"
    },
    age: {
      required: true,
      type: "integer",
      min: 0,
      max: 9000 // OVER 9000!???!!!
    },
    test: {
      model: "test"
    }
  }
}
