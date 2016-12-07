"use strict"

module.exports = class extends Map {
  constructor() {
    super()

    this.set("flow_runner", function flow_runner(task, done) { done(null) }.bind(this))
  }
  register(host) {
    host.set("server", this)
  }
  start(callback) { callback(null); return this }
  stop(callback) { callback(null); return this }
  generate_routes() {}
}
