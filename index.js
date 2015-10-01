"use strict"

// Turn objects into message busses.
const Talkie = require("@newworldcode/talkie")

// Get some bits we need to instantiate later.
const Config = require("./lib/config")
const Stash = require("./lib/stash")

class multicolour {
  /**
   * Create some internal properties and load in
   * the CLI and configuration.
   *
   * @param  {Object} config to start Multicolour with
   * @return {void}
   */
  constructor(config) {
    // Set raw properties on Multicolour.
    this.__props = new Map([
      ["cli", require("./lib/cli")],
      ["config", new Config(config)]
    ])

    // Reply to requests with the right modules.
    this
      // Get the CLI.
      .reply("cli", this.__props.get("cli"))

      // Configuration for multicolour.
      .reply("config", this.__props.get("config"))

      // Generate a unique id.
      .reply("uuid", () => require("uuid").v4())

      // Some static types used throughout Multicolour.
      .reply("types", require("./lib/consts"))

      // Create a stash.
      .reply("stashes", new Map())
  }

  scan() {
    // Get our content location.
    const content = this.request("config").get("content")

    // Get the file list.
    const files = require("fs").readdirSync(`${content}/blueprints`)

    this.__props.set("blueprints", files)
    this.reply("blueprints", this.__props.get("blueprints"))

    return this
  }

  /**
   * Configure a plugin to run with Multicolour.
   * @param  {Object} configuration of the plugin.
   * @return {multicolour} object for chaining.
   */
  use(configuration) {
    // Get our types so we can switch the arg.
    const types = this.request("types")

    if (!this.request("blueprints")) {
      throw new ReferenceError("Cannot generate without first scanning.")
    }

    // Switch the type in the configuration
    switch (configuration.type) {
    case types.SERVER_GENERATOR:
      // Creat a new server stash.
      this.request("stashes").set(configuration.id, new Stash())

      // Set the server and run the generator.
      this.__props.set("server", configuration.generator(
        this.request("blueprints"),
        this.request("config").get("api"),
        this.request("stashes")
      ))

      break

    case types.FRONTEND_GENERATOR:
      break
    }

    return this
  }

  /**
   * Destroy all resources gracefully and terminate Multicolour.
   * @return {multicolour} Object for chaining.
   */
  destroy() {
    // Get the servers so we can gracefully shutdown.
    this.request("server").stop()
  }
}

// Make Multicolour a messaging bus between
// the various open source projects behind it.
Talkie().extend(multicolour)

// Export the final Multicolour.
module.exports = multicolour
