// Get the testing library.
const tape = require("tape")

// Get Multicolour.
const Multicolour = require("../index.js")

// Where we keep the test content.
const test_content_path = "./test_content/"

tape("Multicolour initializes with base properties.", test => {
  const multicolour = new Multicolour()

  // Has members.
  test.equals(!!multicolour.__props, true, "Has __props member.")
  test.equals(!!multicolour.request, true, "Has request function.")
  test.equals(!!multicolour.reply, true, "Has reply function.")
  test.equals(!!multicolour.destroy, true, "Has destroy function.")
  test.equals(!!multicolour.use, true, "Has use function.")
  test.equals(!!multicolour.scan, true, "Has scan function.")

  // Replies with values.
  test.equals(!!multicolour.request("cli"), true, "Does reply with CLI member.")
  test.equals(!!multicolour.request("config"), true, "Does reply with config member.")
  test.equals(!!multicolour.request("uuid"), true, "Does reply with uuid.")
  test.equals(!!multicolour.request("types"), true, "Does reply with types dictionary.")

  // Done and dusted. Go home.
  test.end()
})

tape("Multicolour scans for content.", test => {
  const multicolour = new Multicolour({ content: test_content_path })

  // Register a fake server generator.
  console.log(multicolour.scan().next())

  /* eslint-disable */
  test.notEqual(multicolour.request("blueprints"), undefined, "Blueprints should exist.")
  /* eslint-enable */

  // Done and dusted. Go home.
  test.end()
})

tape("Multicolour can register generators.", test => {
  const multicolour = new Multicolour()
  const server_plugin = {
    type: multicolour.request("types").SERVER_GENERATOR,
    id: multicolour.request("uuid"),
    generator: (blueprints, api_config, stash) => stash
  }

  // Register a fake server generator.
  multicolour.use(server_plugin)

  /* eslint-disable */
  test.notEqual(multicolour.request("server"), undefined, "Servers should not be undefined.")
  test.notEqual(multicolour.request("stashes").get(server_plugin.id), undefined, "Should create a stash for the plugin/")
  /* eslint-enable */

  // Done and dusted. Go home.
  test.end()
})
