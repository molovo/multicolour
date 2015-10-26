"use strict"

// For path resolution.
const path = require("path")
const fs = require("fs-extra")

class cli extends Map {
  /**
   * Set up commander to accept the various
   * arguments and commands that make multicolour
   * easy to get started with.
   * @return {multicolour} Object for chaining.
   */
  constructor() {
    super()

    // Create a program.
    this.program = require("commander", { bust: true })

    // Set up the start command.
    this.program
      .command("start [config.js]")
      .description("Start Multicolour.")
      .option("-c, --config <path>", "Which config file to load", "./config.js")
      .action(this.start.bind(this))

    // Set up the stop command.
    this.program
      .command("stop")
      .description("Stop Multicolour.")
      .action(this.stop.bind(this))

    // Set up the init command.
    this.program
      .command("init [target]")
      .alias("I")
      .description("Create a new Multicolour project in the target directory and start the wizard.")
      .option("-t, --target <dir>", "Where to init.", "./")
      .action(this.init.bind(this))

    // Exit.
    return this
  }

  /**
   * Parse the/any arguments passed
   * through via the cli.
   * @return {cli} Object for chaining.
   */
  parse() {
    // Parse the args.
    this.program.parse(process.argv)

    // Check the length of the arguments passed in
    // so we know whether to show the help message or not.
    if (!process.argv.slice(2).length) {
      this.program.outputHelp()
    }

    // Exit.
    return this
  }

  /**
   * Set the scope of the operations conducted
   * by this instance of the CLI tool.
   * @param  {multicolour} target_multicolour to use as the scope.
   * @return {cli} Object for chaining.
   */
  scope(target_multicolour) {
    // Check we got a target.
    if (!target_multicolour) {
      throw new ReferenceError("Target should be defined to set scope.")
    }

    // Set the scope of this CLI to an instance of Multicolour.
    this.__scope = target_multicolour

    // Return for chaining.
    return this
  }

  /**
   * Ask a series of questions then act upon the developers answers.
   * @param  {Commander} command executing this function.
   * @param  {Object} options passed in via the CLI
   * @return {cli} Object for chaining.
   */
  init(command, options) {
    // We need to validate the package name for npm.
    const valid_name = require("validate-npm-package-name")

    // Set up the CLI interface.
    const inquirer = require("inquirer", { bust: true })

    // Get the path to the target.
    const target = path.resolve(options.target)

    // Set up some things we need to function well.
    this.set("init_target", target)

    inquirer.prompt([
      {
        default: "n",
        type: "input",
        name: "confirmed",
        message: "THIS WILL BASH YOUR CONFIG.JS AND PACKAGE.JSON, IF THEY EXIST. Continue?",
        validate: is_okay => {
          if (is_okay.toLowerCase() === "no" || is_okay.toLowerCase() === "n") {
            process.exit(0)
          }
          else {
            return true
          }
        }
      },
      {
        type: "input",
        name: "project_name",
        message: "Enter your project's name:",
        default: path.basename(target).toLowerCase(),
        validate: value => valid_name(value).validForNewPackages
      },
      {
        type: "list",
        name: "server",
        message: "What server technology would you like to use?",
        default: "hapi",
        choices: [
          "hapi"
        ]
      },
      {
        type: "list",
        name: "database",
        message: "What database technology would you like to use?",
        default: "postgresql",
        choices: [
          "mongo",
          "postgresql",
          "mysql",
          "redis",
          "twitter",
          "cassandra",
          "arango"
        ]
      },
      {
        type: "checkbox",
        name: "authentication",
        message: "What authentication do you want for your API?",
        choices: [
          "JWT", "Twitter", "Facebook", "GitHub", "Google", "Instagram", "LinkedIn",
          "Yahoo", "Foursquare", "VK", "ArcGIS Online", "Windows Live", "Nest",
          "Phabricator", "BitBucket", "Reddit", "Tumblr"
        ]
      }
    ], this._deal_with_init_answers.bind(this))

    return this
  }

  /**
   * Start the services described.
   * @param  {Commander} command executing this function.
   * @param  {Object} options passed in via the CLI
   * @return {cli} Object for chaining.
   */
  start(command, options) {
    // Check we have scope to start services on.
    if (!this.__scope) {
      throw new ReferenceError("No scope in which to start services.")
    }

    // Create an instance and scan for content.
    this.__scope
      .reset_from_config_path(options.config)
      .scan()

    // Check for plugins.
    if (this.__scope.get("config").get("api")) {
      this.__scope.use(require("multicolour-server-hapi"))
    }

    // Start the services.
    this.__scope.start()

    return this
  }

  /**
   * Stop the services described.
   * @param  {Commander} command executing this function.
   * @param  {Object} options passed in via the CLI
   * @return {cli} Object for chaining.
   */
  stop() {
    // Check we have scope to start services on.
    if (!this.__scope) {
      throw new ReferenceError("No scope in which to start services.")
    }

    this.__scope.stop()

    return this
  }

  /**
   * Write a formatted JSON file based on a series
   * of answers from the developer.
   * @param  {Object} answers given by the developer.
   * @return {void}
   */
  write_package_json_file(answers) {
    // Get the target init directory.
    const target = this.get("init_target")

    // Get the template data to generate from.
    const user_package = require("../init/package.json")

    // Get the nice name -> DB name/version dictionary.
    const db_module_table = require("./db-module-table")

    // Get the database type we specified.
    const db_type = db_module_table[answers.database]

    // Add the name.
    user_package.name = answers.project_name.toString().toLowerCase()

    // Add the database dependency.
    user_package.dependencies[db_type.name] = db_type.version

    // Which auth plugin does the developer want?
    if (answers.authentication.indexOf("JWT") > -1) {
      user_package.dependencies["multicolour-auth-jwt"] = "^1.0.0"
    }
    else {
      user_package.dependencies["multicolour-auth-oauth"] = "^1.0.0"
    }

    // Write the package.json
    fs.writeFile(`${target}/package.json`, JSON.stringify(user_package, " ", 2), err => {
      if (err) {
        console.log("Failed to write package.json. Please paste '%s' manually", JSON.stringify(user_package, " ", 2))
      }
    })
  }

  /**
   * Write a formatted config file based on a series
   * of answers from the developer.
   * @param  {Object} answers given by the developer.
   * @return {void}
   */
  create_config_js_file(answers) {
    // Get the target init directory.
    const target = this.get("init_target")

    // Get the template data to generate from.
    const user_config = require("../init/config")

    // Get the nice name -> DB name/version dictionary.
    const db_module_table = require("./db-module-table")

    // Get the database type we specified.
    const db_type = db_module_table[answers.database]

    let contents = `"use strict"`

    // Update the user configuration.
    user_config.content = `./content`
    user_config.auth = {
      // Generate a nice, secure password to secure your users' sessions.
      password: require("crypto").createDiffieHellman(800).generateKeys("base64"),

      // You'll need to manually add your client id/secret
      // values to your config.js.
      providers: answers.authentication.map(strategy => {
        return {
          provider: strategy.toString().toLowerCase(),
          clientId: "",
          clientSecret: "",
          isSecure: false
        }
      })
    }
    user_config.db.connections.development = {
      adapter: "development",
      host: "localhost",
      port: 27017,
      database: "multicolour"
    }

    // We'll do a replacement on this later so we only
    // have to open the file for writing once.
    user_config.db.adapters.development = "require({{DB}})"

    // Re-order the keys, gives a better dev experience
    // with a more natural ordering.
    Object.keys(user_config).sort().forEach(key => {
      const value = user_config[key]
      delete user_config[key]
      user_config[key] = value
    })

    // Finalise the string interpolation.
    contents = `${contents}\n\nmodule.exports = ${JSON.stringify(user_config, " ", 2)}`
    contents = contents.replace(/"require\({{DB}}\)"/g, `require("${db_type.name}")`)

    // Write the package.json
    fs.writeFile(`${target}/config.js`, contents, err => {
      if (err) {
        console.log("Failed to write package.json. Please paste '%s' manually", JSON.stringify(user_config, " ", 2))
      }
    })
  }

  /**
   * Copy the example content into place.
   * @return {void}
   */
  copy_example_content() {
    fs.copy(`${__dirname}/../init/content`, `${this.get("init_target")}/content`, err => {
      if (err) {
        throw err
      }
    })
  }

  _deal_with_init_answers(answers) {
    // Write the package.json
    this.write_package_json_file(answers)

    // Write the config.js template.
    this.create_config_js_file(answers)

    // Copy the example content over.
    this.copy_example_content()

    // Get the app file.
    let app = fs.readFileSync(`${__dirname}/../init/app.js`).toString()

    // Replace some variables in the script.
    app = app.replace(/{{SERVER}}/g, `multicolour-server-${answers.server.toLowerCase()}`)

    // Add the auth.
    if (answers.authentication.indexOf("JWT") > -1) {
      app = app.replace(/{{AUTH}}/g, "multicolour-auth-jwt")
    }
    else {
      app = app.replace(/{{AUTH}}/g, "multicolour-auth-oauth")
    }

    // Write a resource script.
    fs.writeFile(`${this.get("init_target")}/app.js`, app, err => {
      if (err) {
        throw err
      }
    })

    console.log(`
      We've generated a few files for you and copied a few things around,
      This includes an app.js, config.js and a content/ folder. Please run
      npm install . to install the dependencies.

      Running multicolour start will start running your server once dependencies are installed.
    `)
  }
}

module.exports = cli
