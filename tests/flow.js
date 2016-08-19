"use strict"

Error.stackTraceLimit = Infinity

// Get the testing library.
const tape = require("tape")
const Task = require("../flow/task")
const Flow = require("../flow")

// Get Multicolour.
const Multicolour = require("../index")

// Create an instance of multicolour.
let multicolour = Multicolour.new_from_config_file_path("./tests/test_content/config.js").scan()

// Add a fake server.
multicolour.use(require("./test_content/server"))

tape("Task run without error.", test => {
  test.plan(6)
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

tape("Flow runs as expected", test => {
  test.plan(2)

  test.throws(() => new Flow(), ReferenceError, "Throws error when no Multicolour instance provided")
  multicolour.Flow
    .create("test", { name: "test", age: 28 })
    .read("test", 1)
    .update("test", 1, { name: "testing" })
    .delete("test", 1)
    .then("read", "test", 1)
    .run(errors => {
      test.ok(!errors, "No errors during basic flow run.")
    })
})

tape("Flow teardown", test => {
  multicolour.get("database").stop(test.end.bind(test))
})
