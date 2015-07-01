// Leverage require.cache so that the logger is only
// created once and used all over our backend app.
module.exports = function createLoggerWithConfiguration(configuration) {
  // Get the bunyan library.
  const bunyan = require('bunyan')

  // So we can find the package.json
  const path = require('path')

  // Clone our config so we don't modify the original.
  var config = require('util')._extend(configuration, {})

  // Check there's at least a logging config object.
  if (!config.hasOwnProperty('logging'))
    config.logging = {}

  console.log(config)

  // Add the logging name if one doesn't exist
  // based on the name in the developers package.json
  if (!config.logging.hasOwnProperty('name'))
    config.logging.name = require(path.join(__dirname, '/../../../package.json')).name

  // Create a logger.
  return bunyan.createLogger(config.logging)
}
