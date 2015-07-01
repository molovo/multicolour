// We'll add things to this and require.cache
// means we don't need to worry about losing it.
const RAINBOW = new Map()

/**
 * This function initiates:
 *
 *  Loading the content folder.
 *  The Hapi route creation.
 *  The Waterline schema creation.
 *
 * @param  {Object} configuration object to boot up with.
 * @return {Rainbow.Core}
 */
module.exports = function RainbowBootupProcedure(configuration) {
  // Check the config isn't frozen.
  if (Object.isFrozen(configuration))
    throw new Error('Configuration object is frozen, config cannot be frozen.')

  // Create the logger.
  const logger = require('./logger')(configuration)

  // Get the glob library for reading out our content directories.
  const glob = require('glob')

  // Get the path library.
  const path = require('path')

  // Get the content path so we can load our stuff.
  var content_root = configuration.content

  // Find our content.
  if (!content_root)
    content_root = path.join(__dirname, '/../../../content/')

  // Log something helpful to the developer.
  logger.info('Loading content from %s', content_root)
}
