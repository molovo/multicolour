"use strict"

// Get async.
const Async = require("async")
const Task = require("./task")

class Flow {
  constructor(multicolour) {
    if (!multicolour) {
      throw new ReferenceError("You must pass an instance of Multicolour into your flows.")
    }

    // Set Multicolour.
    this.multicolour = multicolour

    // Tests will be added here.
    this.tests = new Set()

    // Tasks are not complete by default.
    this.tasks_complete = false

    // We might need to force starting the DB to run tests.
    // Flag here so we can stop it again later.
    this.forced_start = false

    // Return.
    return this
  }

  run(callback) {
    const db = this.multicolour.get("database")

    // If the database isn't connected,
    // force the connection.
    if (!db.get("database_connected")) {
      // Start the database.
      db.start(err => {
        /* istanbul ignore next */
        if (err) throw err

        // Run the tasks.
        this.run_tasks(callback)
      })
    }
    else {
      /* istanbul ignore next */
      this.run_tasks(callback)
    }

    return this
  }

  /**
   * Report the test results.
   *
   * @param {Array} errors that happened during tests.
   * @return {void}
   */
  report(errors) {
    const validators = this.multicolour.get("validators")

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
      console.log("\nAll %d tests passed using %d validators\n", this.tests.size * validators.size, validators.size)
      /* eslint-enable */
    }
  }

  run_tasks(callback) {
    // Start the flows by currying an Async task function.
    Async.series(Array.from(this.tests).map(task => next => task.run(next)), errors => {
      callback && callback(errors)
      this.report(errors)
    })
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
    const search = typeof search_payload === "object" ? search_payload : {id: search_payload}

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
    const search = typeof search_payload === "object" ? search_payload : {id: search_payload}

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
    const search = typeof search_payload === "object" ? search_payload : {id: search_payload}

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
