/* istanbul ignore next */
"use strict"

const Talkie = require("@newworldcode/talkie")

// For path resolution.
const path = require("path")

class cli {
  /**
   * Set up commander to accept the various
   * arguments and commands that make multicolour
   * easy to get started with.
   * @return {multicolour} Object for chaining.
   */
  constructor() {
    // Create a program
    this.program = require("commander", { bust: true })

    // Set up the start command.
    this.program
      .command("start [config.js]")
      .description("Start Multicolour.")
      .option("-c, --config <path>", "Which config file to load", "./config.js")
      .action(this.start)

    // Set up the stop command.
    this.program
      .command("stop")
      .description("Stop Multicolour.")
      .action(this.stop)

    // Set up the init command.
    this.program
      .command("init [target]")
      .alias("I")
      .description("Create a new Multicolour project in the target directory.")
      .option("-t, --target <dir>", "Where to init.", "./")
      .action(this.init)

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

  /* istanbul ignore next: COME BACK AND FIX THIS MESS. */
  init(command, options) {
    // We need to validate the package name for npm.
    /* istanbul ignore next */
    const valid_name = require("validate-npm-package-name")

    // Set up the CLI interface.
    /* istanbul ignore next */
    const inquirer = require("inquirer", { bust: true })

    // Get the path to the target.
    /* istanbul ignore next */
    const target = path.resolve(options.target)

    // Set up some things we need to function well.
    /* istanbul ignore next */
    this.reply("init_target", target)

    /* istanbul ignore next */
    inquirer.prompt([
      {
        type: "input",
        name: "project_name",
        message: "Enter your project's name:",
        default: path.basename(target),
        validate: value => valid_name(value).validForNewPackages
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
        name: "is_secure",
        message: "What authentication do you want for your API?",
        choices: [
          "JWT", "Twitter", "Facebook", "GitHub", "Google", "Instagram", "LinkedIn",
          "Yahoo", "Foursquare", "VK", "ArcGIS Online", "Windows Live", "Nest",
          "Phabricator", "BitBucket", "Reddit", "Tumblr"
        ]
      }
    ], this._deal_with_init_answers)

    /* istanbul ignore next */
    return this
  }

  start(command, options) {
    // Check we have scope to start services on.
    if (!this.__scope) {
      throw new ReferenceError("No scope in which to start services.")
    }

    this.__scope
      .reset_from_config_path(options.config)
      .scan()
      .start()

    return this
  }

  stop() {
    // Check we have scope to start services on.
    if (!this.__scope) {
      throw new ReferenceError("No scope in which to start services.")
    }

    this.__scope.stop()

    return this
  }

  /* istanbul ignore next: COME BACK AND FIX THIS MESS. */
  _deal_with_init_answers(answers) {
    // Get the target init directory.
    /* istanbul ignore next */
    const target = this.request("init_target")

    // Get the nice name -> DB name/version dictionary.
    /* istanbul ignore next */
    const db_module_table = require("db-module-table")

    // For replacing text in a stream.
    /* istanbul ignore next */
    const replace_stream = require("replacestream")

    // Get the file system to open files for writing.
    /* istanbul ignore next */
    const fs = require("fs")

    // Where we gett the content templates from.
    /* istanbul ignore next */
    const content = path.resolve(`${__dirname}/../init/`)

    // Get the database tech the dev asked for from the map.
    /* istanbul ignore next */
    const db_tech = db_module_table[answers.database]

    // Empty auth block ready for when (if) they desire authentication.
    /* istanbul ignore next */
    const auth_block = {}

    // Copy the config over with the database type substituted.
    /* istanbul ignore next */
    const config_stream = fs
      .createReadStream(`${content}/config.js`)
      .pipe(replace_stream("{{DATABASE_REQUIRE}}", db_tech.name))

    // If they want auth on their API, generate a salt and dump
    // it in their config file
    /* istanbul ignore next */
    if (answers.is_secure && answers.is_secure !== "None") {
      // Generate a lengthy, random salt.
      const salt = require("crypto").createDiffieHellman(800).generateKeys("base64")

      // Set the private key.
      auth_block.privateKey = salt

      // Get the provider type.
      switch (answers.is_secure.toLowerCase()) {
      case "jwt":
        auth_block.provider = "token"
        break
      default:
        auth_block.provider = answers.is_secure.toLowerCase()
        break
      }
    }

    // Write the config file.
    /* istanbul ignore next */
    config_stream
      .pipe(replace_stream("{{AUTH_BLOCK}}", JSON.stringify(auth_block, null, "  ")))
      .pipe(fs.createWriteStream(`${target}/config.js`))

    // Copy the package.json over with the database type substituted.
    /* istanbul ignore next */
    fs
      .createReadStream(`${content}/package.json`)
      .pipe(replace_stream("{{PROJECT_NAME}}", answers.project_name))
      .pipe(replace_stream("{{DATABASE_REQUIRE}}", db_tech.name))
      .pipe(replace_stream("{{DATABASE_VERSION}}", db_tech.version))
      .pipe(fs.createWriteStream(`${target}/package.json`))

    // Copy the example content over.
    /* istanbul ignore next */
    fs.copy(`${content}/content`, `${target}/content`, err => err && console.error(err))

    // Emit a done event.
    /* istanbul ignore next */
    this.emit("init_complete")

    // Done
    /* istanbul ignore next */
    console.log("Generated some example stuff for you, don\"t forget to run npm install .")
  }
}

Talkie().extend(cli)

module.exports = cli
