"use strict"

// Get the CLI library(s).
const program = require("commander")
const inquirer = require("inquirer")

// So we can resolve the location of your config.
const path = require("path")

// For copying the content over.
const fs = require("fs-extra")
const replace_stream = require("replacestream")

// Get the package info.
const pack = require("../package.json")

// Get the DB tech table so we know what module to install later.
const db_module_table = require("./db-module-table")

// Set up the program arguments.
program.version(`${pack.name} - ${pack.version}`)

// INIT
program
  .command("init [target]")
  .alias("I")
  .description("Create a new Multicolour project in the target directory.")
  .option("-t, --target <dir>", "Where to init.", "./")
  .action((command, options) => {
    // Get the path to the target.
    const target = path.resolve(options.target)
    const content = path.resolve(`${__dirname}/../init/`)

    inquirer.prompt([
      {
        type: "list",
        name: "database",
        message: "What database technology would you like to use?",
        choices: [
          "mongo",
          "postgresql",
          "mysql",
          "redis",
          "twitter",
          "cassandra",
          "arango"
        ]
      }
    ], answers => {
      const db_tech = db_module_table[answers.database]

      // Copy the config over with the database type substituted.
      fs
        .createReadStream(`${content}/config.js`)
        .pipe(replace_stream("{{DATABASE_REQUIRE}}", db_tech.name))
        .pipe(fs.createWriteStream(`${target}/config.js`))

      // Copy the package.json over with the database type substituted.
      fs
        .createReadStream(`${content}/package.json`)
        .pipe(replace_stream("{{DATABASE_REQUIRE}}", db_tech.name))
        .pipe(replace_stream("{{DATABASE_VERSION}}", db_tech.version))
        .pipe(fs.createWriteStream(`${target}/package.json`))

      // Copy the example content over.
      fs.copy(`${content}/content`, `${target}/content`, err => err && console.error(err))

      // Done
      console.log("Generated some example stuff for you, don\"t forget to run npm install .")

      // We don't want to start the server yet.
      program.start = false
    })
  })

// Check we passed a config in.
program
  .command("start [config.js]")
  .description("Start the Multicolour server(s).")
  .option("-c, --config <path>", "Which config file to load", "./config.js")
  .action((command, options) => {
    program.config = require(path.resolve(options.config))
    program.start = true
  })

program.parse(process.argv)

// Export.
module.exports = program
