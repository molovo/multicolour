'use strict'

// Get the CLI library.
const program = require('commander')

// Colour the CLI.
const colours = require('cli-color')

// So we can resolve the location of your config.
const path = require('path')

// Set up the program arguments.
program
  .version(require('./package.json').version)
  .option('-c, --config [path]', 'Open this specific configuration.')
  .option('-e, --environment [env]', 'Use a specific environment in your configuration.')
  .parse(process.argv)

// Check we passed a config in.
if (!program.config) {
  console.log(colours.white.bgRed('Must pass -c or --config option.'))
  process.exit()
}

// Fix the path and get the config.
program.config = require(path.resolve(program.config))

// Export.
module.exports = program
