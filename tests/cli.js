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

tape("CLI initializes an interface", test => {
  // Create an instance of multicolour.
  const multicolour = new Multicolour({ content: test_content_path })

  // Get the CLI from it.
  const cli = multicolour.cli()

  // Test it's not undefined and it is instantiated correctly.
  test.notEqual(typeof cli, "undefined", "CLI should not be undefined")
  test.notEquals(typeof cli.__scope, "undefined", "cli.__scope is is not undefined (set in multicolour.cli).")
  test.deepEquals(cli.__scope, multicolour, "Scope is set to the instance of multicolour instantiated.")
  test.notEquals(typeof cli.program, "undefined", "cli instance has a program.")

  test.end()
})

tape("CLI scope should change when using `.scope()`", test => {
  test.plan(2)

  // Create an instance of multicolour.
  const multicolour = new Multicolour({ content: test_content_path })
  const alt_multicolour = new Multicolour()

  // Get the CLI from it.
  const cli = multicolour
    .cli()
    .scope(alt_multicolour)

  test.deepEquals(cli.__scope, alt_multicolour, "Scope changed to alternative instance of multicolour.")
  test.throws(() => cli.scope(), ReferenceError, "Should throw ReferenceError when no scope provided.")

  multicolour.reset()
})

tape("CLI start and stop", test => {
  // Create an instance of multicolour.
  const multicolour = new Multicolour({ content: test_content_path })
  const server_plugin = {
    type: multicolour.get("types").SERVER_GENERATOR,
    generator: Server
  }

  // Set up multicolour.
  multicolour
    // Scan for content.
    .scan()
    // Use the server plugin.
    .use(server_plugin)

  // Get the CLI
  let cli = multicolour.cli()

  // Don't ever do this, just for tests.
  delete cli.__scope

  test.throws(() => cli.start(), ReferenceError, "Start should throw when no __scope present and server start fired.")
  test.throws(() => cli.stop(), ReferenceError, "Stop should throw when no __scope present and server stop fired.")

  // Re-set the scope.
  cli = cli.scope(multicolour)

  // Make sure nothing throws here.
  cli.start(cli.program, { config: `${test_content_path}/config.js` })
  cli.stop()

  // Reset.
  multicolour.reset()

  test.end()
})
