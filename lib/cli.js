'use strict'

// Get the CLI library.
const program = require('commander')

// Colour the CLI.
const colours = require('cli-color')

// So we can resolve the location of your config.
const path = require('path')

// A string formatter.
const format = require('util').format

// Get the package info.
const pack = require('../package.json')

// Set up the program arguments.
program
  // What version of multicolour is this?
  .version(format('%s - %s', pack.name, pack.version))

  // Set up our options.
  .option('-c, --config [path]', 'Open this specific configuration.')
  .option('-e, --environment [env]', 'Use a specific environment in your configuration.')
  .option('-s, --server [command]', 'Start up PM2 and start serving your app(s).')

  // Get their values.
  .parse(process.argv)

// Check we passed a config in.
if (program.config) {
  // Fix the path and get the config.
  program.config = require(path.resolve(program.config))
}

// Export.
module.exports = program
