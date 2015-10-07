"use strict"

// Get the testing library.
const tape = require("tape")

// Get Multicolour.
const Multicolour = require("../index.js")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

// Used in a few tests below.
class Server {
  constructor(blueprints, api_config, stash) {}
  warn() { return this }
  start(callback) { callback && callback(); return this }
  stop(callback) { callback && callback(); return this }
}

tape("Waterline collections are created by Multicolour on instantiation.", test => {
  // Create an instance of multicolour.
  const multicolour = new Multicolour()
    .from_config_file_path("./tests/test_content/config.js")
    .scan()

  test.notEquals(typeof multicolour.request("blueprints"), "undefined", "Blueprints exists")
  test.notEquals(typeof multicolour.request("database"), "undefined", "Database exists")
  test.throws(() => multicolour.request("database").start(), TypeError, "Should throw without a callback.")
  test.throws(() => multicolour.request("database").start(() => {}), Error, "Should throw without adapters in config.")

  test.end()
})
