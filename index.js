"use strict"

// Turn objects into message busses.
const Talkie = require("@newworldcode/talkie")

// Get some bits we need to instantiate later.
const Config = require("./lib/config")

class multicolour extends Map {
  /**
   * Create some internal properties and load in
   * the CLI and configuration.
   *
   * @param  {Object} config to start Multicolour with
   * @return {void}
   */
  constructor(config) {
    // Construct.
    super()

    // Set raw properties on Multicolour.
    this
      // Get the CLI.
      .set("cli", require("./lib/cli"))

      // Set the configuration for this instance.
      .set("config", config instanceof Config ? config : new Config(config))

      // Some static types used throughout Multicolour.
      .set("types", require("./lib/consts"))

      // Create a stash.
      .set("stashes", new Map())

      // Set the environment we're in.
      .set("env", process.env.NODE_ENV || "development")

    // Where is the package.
    const package_path = require("path").resolve("package.json")

    // Get the package as well, if it exists.
    if (require("fs").existsSync(package_path)) {
      /* istanbul ignore next: Untestable */
      this.set("package", require(package_path))
    }

    // Reply to requests with the right modules.
    this
      // Get the CLI.
      .reply("cli", this.get("cli"))

      // Generate a unique id.
      .reply("uuid", () => require("uuid").v4())
  }

  /**
   * Update the config for this instance of Multicolour
   * based on the contents of a config file.
   * @param  {String} config_location to load config from.
   * @return {multicolour} Newly created instance of Multicolour.
   */
  static new_from_config_file_path(config_location) {
    // Check we got a config location.
    if (!config_location || config_location === "") {
      throw new ReferenceError("Config location must be a (string) value")
    }

    // Create a new configuration object from the file path.
    const conf = Config.new_from_file(config_location)

    // Return a new instance of Multicolour.
    return new multicolour(conf)
  }

  reset_from_config_path(config_location) {
    this.set("config", Config.new_from_file(config_location))
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
    return this.new("cli").scope(this).parse()
  }

  /**
   * Scan the content directory for content like blueprints,
   * config files, etc and set the appropriate properties on
   * this instance of multicolour.
   * @return {multicolour} object for chaining.
   */
  scan() {
    // Get our content location.
    const content = this.get("config").get("content")

    if (!content) {
      throw new ReferenceError("Content is not set in the config. Not scanning.")
    }

    // Get the file list.
    const files = require("fs").readdirSync(`${content}/blueprints`)
      // Create a full path from it.
      .map(file => `${content}/blueprints/${file}`)

    // Set the blueprints property.
    this.set("blueprints", files)

    // Set up the DB.
    this.use(require("./lib/db"))

    return this
  }

  /**
   * Configure a plugin to run with Multicolour.
   * @param  {Object} configuration of the plugin.
   * @return {multicolour} object for chaining.
   */
  use(configuration) {
    // Get our types so we can switch the arg.
    const types = this.get("types")
    const plugin_id = this.request("uuid")

    // Check we can generate anything at all.
    if (!this.get("blueprints")) {
      throw new ReferenceError("Cannot generate without first scanning.")
    }

    // Creat a new stash for the plugin.
    this.get("stashes").set(plugin_id, new Map())

    // Extend the plugin to have bits and bobs it will likely need.
    Talkie().extend(configuration.generator)
      .reply("host", this)
      .reply("id", plugin_id)
      .reply("stash", this.get("stashes").get(plugin_id))

    // Create the plugin.
    const plugin = new configuration.generator()

    // Switch the type in the configuration
    switch (configuration.type) {
    case types.SERVER_GENERATOR:
      this.set("server", plugin)
      break

    case types.DATABASE_GENERATOR:
      this.set("database", plugin)
      break

    default:
      throw new TypeError(`Plugin not a recognised type, "${configuration.type}" invalid value.`)
    }

    return this
  }

  /**
   * Start the various services behind Multicolour.
   * @param {Function} callback to execute when server has started with error argument.
   * @return {multicolour} object for chaining.
   */
  start(callback) {
    // Get the server & database.
    const server = this.get("server")
    const database = this.get("database")

    // Check for a server before trying to start.
    if (!server) {
      const err = new ReferenceError("No server configured, not starting.")

      return callback(err)
    }

    // The database start is async, wait for that first.
    database.start((err, models) => {
      if (err) {
        return callback(err)
      }

      // Set the models on the database so we
      // can access them elsewhere in the codebase.
      database.set("models", models)

      // Emit an event to say the server has stopped.
      this.trigger("server_starting", server)

      // Start the API server
      server
        .warn("command", this.get("types").SERVER_BOOTUP)
        .start(callback)
    })

    return this
  }

  /**
   * Destroy all resources gracefully and terminate Multicolour.
   * @param {Function} callback to execute when server has shutdown with error argument.
   * @return {multicolour} Object for chaining.
   */
  stop(callback) {
    // Get the server (undefined if it doesn't exist.)
    const server = this.get("server")

    // Get the servers so we can gracefully shutdown.
    if (server) {
      // Emit an event to say the server has stopped.
      this.trigger("server_stopping", server)

      server
        .warn("command", this.get("types").SERVER_SHUTDOWN)
        .stop(callback)
    }
    else {
      callback && callback(new ReferenceError("No server to shutdown. Ignoring."))
    }

    return this
  }
}

// Make Multicolour a messaging bus between
// the various open source projects behind it.
Talkie().extend(multicolour)

// Export the final Multicolour.
module.exports = multicolour
