"use strict"

// Get the testing library.
const tape = require("tape-catch")

// Get Multicolour.
const Multicolour = require("../index.js")
const Plugin = require("../lib/plugin")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

// Used in a few tests below.
class Server {
  constructor() { }
  register(multicolour) { multicolour.set("server", this) }
  start(callback) { callback(); return this }
  stop(callback) { callback(); return this }
}

class Alt extends Plugin {}

tape("(Stupid tests) Multicolour initializes with base properties.", test => {
  const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js")

  // Has members.
  test.ok(multicolour.request, "Has request function.")
  test.ok(multicolour.reply, "Has reply function.")
  test.ok(multicolour.use, "Has use function.")
  test.ok(multicolour.scan, "Has scan function.")
  test.ok(multicolour.start, "Has start function.")
  test.ok(multicolour.stop, "Has stop function.")
  test.ok(Multicolour.Endpoint, "Has Endpoint lib.")
  test.ok(Multicolour.handlers, "Has handlers object.")

  // Replies with values.
  test.ok(multicolour.new("cli"), "Does reply with CLI member.")
  test.ok(multicolour.get("config"), "Does reply with config member.")
  test.ok(multicolour.request("new_uuid"), "Does reply with uuid.")

  // Done and dusted. Go home.
  test.end()
})

tape("Multicolour configures itself.", test => {
  // Load from a file.
  const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js")

  // Get the config object to check a few things were done right.
  const config = multicolour.get("config")

  test.notEqual(typeof multicolour.get("config"), "undefined", "Config should exist.")
  test.throws(() => Multicolour.new_from_config_file_path(), ReferenceError, "Should throw without path argument")
  test.throws(() => multicolour.reset_from_config_path(), TypeError, "Should throw without path argument")
  test.doesNotThrow(() => multicolour.reset_from_config_path(test_content_path + "/config.js"), TypeError, "Should not throw with path argument")
  test.notEqual(typeof config.get("content"), "undefined", "Config should have a content property.")

  // Done and dusted. Go home.
  test.end()
})

tape("Multicolour can register plugins.", test => {
  // Load from a file.
  const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js")

  // Register a fake server generator.
  multicolour.scan().use(Server)

  test.doesNotThrow(() => multicolour.use(Alt), "Should not throw if plugin inherits from Multicolour.Plugin.")
  test.notEqual(typeof multicolour.get("server"), "undefined", "Should register server plugin.")

  multicolour.stop(test.end.bind(test))
})

tape("Multicolour scans for and finds blueprints.", test => {
  const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js").scan()

  test.notEqual(typeof multicolour.get("blueprints"), "undefined", "Blueprints should exist.")

  // Scan for content when there's no config set.
  test.throws(() => new Multicolour().scan(), Error, "Throws error when no content path is set.")

  // Done and dusted. Go home.
  multicolour.stop(test.end.bind(test))
})

tape("Multicolour can start and stop a server and throws expected errors.", test => {
  // Expect N tests.
  test.plan(3)

  // Create an instance of Multicolour.
  const multicolour = Multicolour
    .new_from_config_file_path(test_content_path + "config.js")
    .scan()

  // Register the plugin.
  multicolour.use(Server)

  // Check when a server is configured properly that error is non-existent.
  multicolour.start(err => {
    test.ok(!err, "Error not set when starting properly configured server plugin.")

    multicolour.stop(err => {
      // @TODO: Come back when this is fixed in the dependency.
      // FWIW: This is shit.
      if (err && err.message === "Cannot read property 'teardown' of undefined") {
        test.equal(err.message, "Cannot read property 'teardown' of undefined", "This 🐄 💩 error can be expected.")
      }
      else {
        test.ok(!err, "Error not set when stopping properly configured server plugin.")
      }
    })
  })

  test.throws(() => {
    const bad_multicolour = new Multicolour({
      db: {},
      content: test_content_path
    }).scan()

    bad_multicolour.start(() => bad_multicolour.stop())
  }, Error, "Improperly configured DB throws on start with callback.")
})

tape("Multicolour global setup", test => {
  const config = require("./test_content/config.js")

  config.make_global = true

  // Create an instance of Multicolour.
  const multicolour = new Multicolour(config).scan()

  test.ok(global.multicolour, "Multicolour should be global when configured so.")

  multicolour.stop(test.end.bind(test))
})
