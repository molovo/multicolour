"use strict"

const validator = require("./validator")

module.exports = class extends Map {
  constructor() {
    super()

    this.set("flow_runner", function flow_runner(task, done) { done(null) }.bind(this))
    this.set("validators", [])

    const validation = new validator()
    validation.register(this)
  }
  register(host) {
    host.set("server", this)
  }
  start(callback) { callback(null); return this }
  stop(callback) { callback(null); return this }
  generate_routes() {}
}
