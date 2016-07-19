"use strict"

const lex = require("./lex")
const chalk = require("chalk")

class Task {
  constructor(options) {
    if (typeof options === "undefined") {
      throw new TypeError("No options passed to task.")
    }
    
    if (!options.verb) {
      throw new ReferenceError(
        `verb is a required argument to Task.
        new Task({
          verb: "",
          model: {},
          multicolour: {}
        })`
      )
    }

    if (!options.model) {
      throw new ReferenceError(
        `model is a required argument to Task.
        new Task({
          verb: "",
          model: {},
          multicolour: {}
        })`
      )
    }

    if (!options.multicolour) {
      throw new ReferenceError(
        `multicolour is a required argument to Task.
        new Task({
          verb: "",
          model: {},
          multicolour: {}
        })`
      )
    }

    // Apply the other options.
    this.verb = lex[options.verb.toString().toLowerCase()]
    this.model = options.model
    this.payload = options.payload
    this.expected = options.expected
    this.search = options.search

    // We need this to get transformers and what not later.
    this.__multicolour = options.multicolour
  }

  run(next) {
    const server = this.__multicolour.get("server")
    const flow_runner = server.get("flow_runner")

    // Check the server plugin in use has
    // a method to run the flows.
    /* istanbul ignore next */
    if (!flow_runner) {
      next(new Error(chalk.red.bold("No Flow runner available on this server plugin. Not running")))
    }
    else {
      flow_runner(this, next)
    }

    return this
  }
}

module.exports = Task
