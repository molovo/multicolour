"use strict"

// Get the testing library.
const tape = require("tape-catch")

// Get Multicolour.
const Multicolour = require("../index.js", { bash: true })

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

tape("Handlers", test => {
  // Create an instance of multicolour.
  const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js").scan()

  multicolour.start(() => {
    const model = multicolour.get("database").get("models").test
    const handlers = Multicolour.handlers

    test.doesNotThrow(() => handlers.set_host(multicolour), "Doesn't throw error when setting host for handlers.")
    test.doesNotThrow(() => handlers.collection_has_associations(model), "Doesn't throw error while checking for associations on a collection.")

    multicolour.stop(test.end.bind(test))
  })
})
