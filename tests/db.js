"use strict"

// Get the testing library.
const tape = require("tape")

// Get Multicolour.
const Multicolour = require("../index.js")
const Waterline_Generator = require("../lib/db")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

tape("Waterline collections are created by Multicolour on instantiation and we only get expected errors.", test => {
  test.plan(4)

  // Create an instance of multicolour.
  const multicolour = Multicolour
    .new_from_config_file_path(`${test_content_path}config.js`)
    .scan()

  test.notEquals(typeof multicolour.get("blueprints"), "undefined", "Blueprints exists")
  test.notEquals(typeof multicolour.get("database"), "undefined", "Database exists")
  test.throws(() => multicolour.get("database").start(), TypeError, "Should throw without a callback.")

  delete multicolour.get("config").delete("db")
  test.throws(() => multicolour.get("database").start(err => {throw err}), Error, "Should throw without proper config.")

  // Reset Multicolour
  multicolour.reset()
})
