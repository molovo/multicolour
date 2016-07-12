"use strict"

// Turn objects into message busses.
const Talkie = require("@newworldcode/talkie")

// Get some bits we need to instantiate later.
const Config = require("./lib/config")
const Async = require("async")

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

      // Set the environment we're in.
      .set("env", process.env.NODE_ENV || "development")

      // We haven't scanned yet.
      .set("has_scanned", false)

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
      .reply("new_uuid", () => require("uuid").v4())

    // Does the config say to add to global?
    if (this.get("config").get("make_global")) {
      /* eslint-disable */
      console.info("Adding anything to global scope is generally bad.\nPlease consider removing make_global: true from your config.")
      /* eslint-enable */
      global.multicolour = this
    }
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
      throw new ReferenceError("Config location should be a (string) value")
    }

    // Create a new configuration object from the file path.
    const conf = Config.new_from_file(config_location)

    // Return a new instance of Multicolour.
    return new multicolour(conf)
  }

  /**
   * Reset the config on this instance of Multicolour.
   * @param {String} config_location to load config from.
   */
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
    return this.new("cli")
      .scope(this)
      .parse()
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
      // Delete crap like .DS_Store.
      .filter(file_name => file_name !== ".DS_Store")

      // Create a full path from it.
      .map(file => `${content}/blueprints/${file}`)

    // Push our user model to the array of blueprints.
    files.push(require.resolve("./lib/user-model"))

    // Set the blueprints property.
    this
      .set("has_scanned", true)
      .set("blueprints", files)

    // Set up the DB.
    this
      .use(require("./lib/db"))
      .use(require("./lib/storage"))

    return this
  }

  /**
   * Configure a plugin to run with Multicolour.
   * @param  {Object} configuration of the plugin.
   * @return {multicolour} object for chaining.
   */
  use(Plugin) {
    // Get some tools
    const plugin_id = this.request("new_uuid")

    // Extend the plugin to have bits and bobs it will likely need.
    Talkie().extend(Plugin)
      .reply("host", this)
      .reply("id", plugin_id)

    // Create the plugin.
    const plugin = new Plugin()

    // Perform any registration it needs to do.
    plugin.register(this)

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
      throw new ReferenceError("No server configured, not starting.")
    }

    // Don't limit sockets.
    require("http").globalAgent.maxSockets = require("https").globalAgent.maxSockets = Infinity

    // Start the database and server.
    database.start(() => server.start(callback))

    // When we ask the program to terminate,
    // do so as gracefully as programmatically possible.
    process.on("SIGINT", this.stop.bind(this))

    return this
  }

  /**
   * Destroy all resources gracefully and terminate Multicolour.
   * @param {Function} callback to execute when server has shutdown with error argument.
   * @return {multicolour} Object for chaining.
   */
  stop(callback) {
    // Stahp all the things.
    Async.waterfall([
      // Stop the database.
      next => {
        // Emit an event to say the database is stopping.
        this.trigger("database_stopping")

        // Stop the database(s).
        this.get("database").stop(error => {
          // Emit an event once the server has stopped.
          this.trigger("database_stopped")

          next(error)
        })
      },

      // Stop the server.
      next => {
        // Emit an event to say the server is stopping.
        this.trigger("server_stopping")

        // Stop the server.
        this.get("server").stop(() => {
          // Emit an event to say the server has stopped.
          this.trigger("server_stopped")

          // Continue.
          next()
        })
      }
    ], callback)

    return this
  }
}

// Make Multicolour a messaging bus between
// the various open source projects behind it.
Talkie().extend(multicolour)

// Export the final Multicolour.
module.exports = multicolour
