"use strict"

module.exports = {
  autoCreatedAt: false,
  autoUpdatedAt: false,
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
    empty: "string",

    toJSON: function() {
      return this.toObject()
    }
  },

  constraints: {
    post: {
      "test": "payload.test"
    },
    get: {},
    patch: {},
    delete: {},
    put: {}
  },

  can_upload_file: true
}
