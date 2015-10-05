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

  /**
   * Update the config for this instance of Multicolour
   * based on the contents of a config file.
   * @param  {String} config_location to load config from.
   * @return {multicolour} Object for chaining.
   */
  from_config_file_path(config_location) {
    // Check we got a config location.
    if (!config_location || config_location === "") {
      throw new ReferenceError("Config location must be a (string) value")
    }

    // Create a new configuration object from the file path.
    const conf = this.request("config").new_from_file(config_location)

    // Set the config property based on a new config from a file.
    this.__props.set("config", conf)

    // Update the reply reference.
    this.reply("config", this.__props.get("config"))

    return this
  }

  /**
   * Create and return an instance of the CLI tool
   * which performs many few tasks, set the scope
   * of the CLI tool to this currently running instance
   * by default.
   * @return {CLI} CLI instance to run commands on.
   */
  cli() {
    return this.new("cli").scope(this)
  }

  /**
   * Scan the content directory for content like blueprints,
   * config files, etc and set the appropriate properties on
   * this instance of multicolour.
   * @return {multicolour} object for chaining.
   */
  scan() {
    // Get our content location.
    const content = this.request("config").get("content")

    if (!content) {
      throw new ReferenceError("Content is not set in the config. Not scanning.")
    }

    // Get the file list.
    const files = require("fs").readdirSync(`${content}/blueprints`)

    // Set the blueprints property.
    this.__props.set("blueprints", files)

    // Set up a reply to the server object.
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
      this.__props.set("server", new configuration.generator(
        this.request("blueprints"),
        this.request("config").get("api") || {},
        this.request("stashes").get(configuration.id)
      ))

      // Reply with the server when requested.
      this.reply("server", this.__props.get("server"))

      break
    }

    return this
  }

  /**
   * Start the various services behind Multicolour.
   * @param {Function} callback to execute when server has started.
   * @return {multicolour} object for chaining.
   */
  start(callback) {
    // Get the server (undefined if it doesn't exist.)
    const server = this.request("server")

    if (server) {
      // Start the API server
      server
        .warn("message", this.request("types").SERVER_BOOTUP)
        .start(callback)
    }
    else {
      callback(new ReferenceError("No server to start. Ignoring."))
    }

    // Emit an event to say the server has started.
    this.trigger("server_starting", server)

    return this
  }

  /**
   * Destroy all resources gracefully and terminate Multicolour.
   * @param {Function} callback to execute when server has shutdown.
   * @return {multicolour} Object for chaining.
   */
  stop(callback) {
    // Get the server (undefined if it doesn't exist.)
    const server = this.request("server")

    // Get the servers so we can gracefully shutdown.
    if (server) {
      server
        .warn("message", this.request("types").SERVER_SHUTDOWN)
        .stop(callback)
    }
    else {
      callback(new ReferenceError("No server to shutdown. Ignoring."))
    }

    // Emit an event to say the server has stopped.
    this.trigger("server_stopping", server)

    return this
  }
}

// Make Multicolour a messaging bus between
// the various open source projects behind it.
Talkie().extend(multicolour)

// Export the final Multicolour.
module.exports = multicolour
