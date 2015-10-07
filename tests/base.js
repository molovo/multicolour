"use strict"

// Get the testing library.
const tape = require("tape")

// Get Multicolour.
const Multicolour = require("../index.js")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

// Used in a few tests below.
class Server {
  constructor() {}
  warn() { return this }
  start(callback) { callback(); return this }
  stop(callback) { callback(); return this }
}

tape("(Stupid tests) Multicolour initializes with base properties.", test => {
  const multicolour = new Multicolour()

  // Has members.
  test.equals(!!multicolour.__props, true, "Has __props member.")
  test.equals(!!multicolour.request, true, "Has request function.")
  test.equals(!!multicolour.reply, true, "Has reply function.")
  test.equals(!!multicolour.use, true, "Has use function.")
  test.equals(!!multicolour.scan, true, "Has scan function.")
  test.equals(!!multicolour.start, true, "Has start function.")
  test.equals(!!multicolour.stop, true, "Has stop function.")

  // Replies with values.
  test.equals(!!multicolour.new("cli"), true, "Does reply with CLI member.")
  test.equals(!!multicolour.request("config"), true, "Does reply with config member.")
  test.equals(!!multicolour.request("uuid"), true, "Does reply with uuid.")
  test.equals(!!multicolour.request("types"), true, "Does reply with types dictionary.")

  // Reset multicolour.
  multicolour.reset()

  // Done and dusted. Go home.
  test.end()
})

tape("Multicolour configures itself.", test => {
  // Load from a file.
  const multicolour = new Multicolour().from_config_file_path("./tests/test_content/config.js")

  // Get the config object to check a few things were done right.
  const config = multicolour.request("config")

  test.notEqual(typeof multicolour.request("config"), "undefined", "Config should exist.")
  test.throws(() => multicolour.from_config_file_path(), ReferenceError, "Should throw without path argument")
  test.notEqual(typeof config.get("content"), "undefined", "Config should have a content property.")

  // Reset multicolour.
  multicolour.reset()

  // Done and dusted. Go home.
  test.end()
})

tape("Multicolour can register plugins.", test => {
  // Load from a file.
  const multicolour = new Multicolour().from_config_file_path("./tests/test_content/config.js")

  const server_plugin = {
    type: multicolour.request("types").SERVER_GENERATOR,
    id: multicolour.request("uuid"),
    generator: Server
  }

  test.throws(() => multicolour.use(server_plugin), ReferenceError, "Should throw without scanning for blueprints first.")

  // Register a fake server generator.
  multicolour
    .scan()
    .use(server_plugin)

  test.notEqual(typeof multicolour.request("server"), "undefined", "Should register server plugin.")
  test.notEqual(typeof multicolour.request("stashes").get(server_plugin.id), "undefined", "Should create a stash for the plugin.")

  // Reset multicolour.
  multicolour.reset()

  // Done and dusted. Go home.
  test.end()
})

tape("Multicolour scans for and finds blueprints.", test => {
  let multicolour = new Multicolour({ content: test_content_path })

  // Scan for content in the above defined content directory.
  multicolour.scan()

  test.notEqual(typeof multicolour.request("blueprints"), "undefined", "Blueprints should exist.")

  // Reset multicolour.
  multicolour.reset()

  multicolour = new Multicolour()

  // Scan for content when there's no config set.
  test.throws(() => multicolour.scan(), ReferenceError, "Throws error when no content path is set.")

  // Reset multicolour.
  multicolour.reset()

  // Done and dusted. Go home.
  test.end()
})

tape("Multicolour can start and stop a server and throws expected errors.", test => {
  // Expect 4 tests.
  test.plan(4)

  // Create an instance of Multicolour.
  const multicolour = new Multicolour()
    .from_config_file_path("./tests/test_content/config.js")
    .scan()

  const server_plugin = {
    type: multicolour.request("types").SERVER_GENERATOR,
    id: multicolour.request("uuid"),
    generator: Server
  }

  // Check some sanity stuff.
  multicolour.start(error => test.throws(() => { throw error }, ReferenceError, "Start throws a ReferenceError when server generator not configured correctly."))
  multicolour.stop(error => test.throws(() => { throw error }, ReferenceError, "Stop throws a ReferenceError when server generator not configured correctly."))

  // Register the plugin.
  multicolour.use(server_plugin)

  // Check when a server is configured properly that error is non-existent.
  multicolour.start(error => test.equal(typeof error, "undefined", "Error not set when starting properly configured server plugin."))
  multicolour.stop(error => test.equal(typeof error, "undefined", "Error not set when stopping properly configured server plugin."))

  // Reset multicolour.
  multicolour.reset()

  // Done and dusted. Go home.
  test.end()
})
