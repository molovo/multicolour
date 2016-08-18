"use strict"

// Get the testing library.
const tape = require("tape-catch")

const Flow = require("../flow")
const Task = require("../flow/task")

// Get Multicolour.
const Multicolour = require("../index.js")

// Create an instance of multicolour.
let multicolour = Multicolour.new_from_config_file_path("./tests/test_content/config.js").scan()

// Add a fake server.
multicolour.use(class extends Map {
  constructor() {
    super()
    this.set("flow_runner", function(task, done) { done(null) }.bind(this))
    this.set("validators", new Map([["application/json", () => {}]]))
  }
  register(host) { host.set("server", this) }
  start(callback) { callback(null); return this }
  stop(callback) { callback(null); return this }
  generate_routes() {}
})

tape("Flow runs without error.", { objectPrintDepth: Infinity }, test => {
  test.plan(8)

  test.doesNotThrow(() => {
    multicolour.Flow
      .create("test", { name: "test", age: 28 })
      .read("test", 1)
      .update("test", 1, { name: "testing" })
      .delete("test", 1)
      .then("read", "test", 1)
      .run()
  }, "Basic Flow does not error while running")

  test.doesNotThrow(() => new Flow(multicolour, () => 1+1).run(), "Basic Flow does not error while running with a before function.")

  test.throws(() => new Task(), TypeError, "Throws when no options passed in")
  test.throws(() => new Task({}), ReferenceError, "Throws when missing verb option")
  test.throws(() => new Task({ verb: "GET" }), ReferenceError, "Throws when missing model option")
  test.throws(() => new Task({ verb: "GET", model: "test" }), ReferenceError, "Throws when missing multicolour option")
  test.doesNotThrow(() => new Task({ verb: "GET", model: "test", multicolour }), ReferenceError, "Doesn't throw an error with minimum args passed in.")

  test.doesNotThrow(() => {
    const task = new Task({
      verb: "GET",
      model: "test",
      multicolour
    })

    task.run(() => {})
  }, "Task 'runs' without throwing error.")
})
