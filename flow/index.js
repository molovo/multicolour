"use strict"

// Get async.
const Async = require("async")
const Task = require("./task")

class Flow {
  constructor(multicolour, before) {
    // Set Multicolour.
    this.multicolour = multicolour

    // If there was a before function, call it.
    this._before = before && before.call(this)

    // Tests will be added here.
    this.tests = new Set()

    // Tasks are not complete by default.
    this.tasks_complete = false

    // Return.
    return this
  }

  run() {
    // Start the database.
    this.multicolour.get("database").start(() => {
      // Generate the routes.
      this.multicolour.get("server").generate_routes()

      const validators = this.multicolour.get("server").get("validators")

      // Start the flows by currying an Async task function.
      Async.series(Array.from(this.tests).map(task => next => task.run(next)), errors => {
        /* istanbul ignore next */
        if (errors && errors.length > 0) {
          /* eslint-disable */
          console.error(errors)
          /* eslint-enable */
          process.exit(1)
        }
        else {
          this.tasks_complete = true

          /* eslint-disable */
          console.log("\nAll %d tests passed using %d validators\n", this.tests.size * validators.length, validators.length)
          /* eslint-enable */
        }
      })
    })

    return this
  }

  create(model, payload) {
    this.tests.add(new Task({
      verb: "create",
      multicolour: this.multicolour,
      model,
      payload
    }))

    return this
  }

  read(model, search_payload) {
    // If it's an object, it's probably already a query
    // otherwise, it's probably an ID of some variety.
    const search = typeof search_payload === "object" ? search_payload : { id: search_payload }

    this.tests.add(new Task({
      verb: "read",
      multicolour: this.multicolour,
      model,
      search
    }))

    return this
  }

  update(model, search_payload, payload) {
    // If it's an object, it's probably already a query
    // otherwise, it's probably an ID of some variety.
    const search = typeof search_payload === "object" ? search_payload : { id: search_payload }

    // Create the task.
    this.tests.add(new Task({
      verb: "update",
      multicolour: this.multicolour,
      search,
      model,
      payload
    }))

    return this
  }

  delete(model, search_payload) {
    // If it's an object, it's probably already a query
    // otherwise, it's probably an ID of some variety.
    const search = typeof search_payload === "object" ? search_payload : { id: search_payload }

    this.tests.add(new Task({
      verb: "delete",
      multicolour: this.multicolour,
      model,
      search
    }))

    return this
  }

  /**
   * A task to be completed before performing the next task.
   * @param  {Object} options to create Tasks from.
   * @return {Flow}
   */
  then(lexable_verb, model, search, payload) {

    // Is options an instance of a Task already?
    const task = new Task({
      verb: lexable_verb,
      model,
      payload,
      search,
      multicolour: this.multicolour
    })

    // Add the test.
    this.tests.add(task)

    return this
  }
}

module.exports = Flow
