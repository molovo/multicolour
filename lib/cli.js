'use strict'

// Get the CLI library.
const program = require('commander')

// Colour the CLI.
const colours = require('cli-color')

// So we can resolve the location of your config.
const path = require('path')

// For the init command.
const fs = require('fs')

// For copying the
const ncp = require('ncp').ncp

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
  .option('-e, --environment [env]', 'Use a specific environment in your configuration. <Nothing right now>')
  .option('-s, --server [command]', 'Start up PM2 and start serving your app(s). <Nothing right now>')
  .option('-I --init [path]', 'Create a new Multicolour project here.', './')

program.start = false

// Check we passed a config in.
program.on('config', () => {
  // Fix the path and get the config.
  program.config = require(path.resolve(program.config))
  program.start = true
})

program.on('init', () => {
  const cwd = path.resolve(program.init)

  // Copy the config sample.
  fs
    .createReadStream(path.resolve(__dirname + '/../init/config-sample.js'))
    .pipe(fs.createWriteStream(format('%s/config.js', cwd)))

  // Copy the package.json
  fs
    .createReadStream(path.resolve(__dirname + '/../init/package.json'))
    .pipe(fs.createWriteStream(format('%s/package.json', cwd)))

  // Copy the default blueprint into place.
  ncp(path.resolve(__dirname + '/../init/content'), format('%s/content', cwd), err => {})

  program.start = false
})

// Get their values.
program.parse(process.argv)

// Export.
module.exports = program
