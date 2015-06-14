
module.exports = function RainbowBootup() {
  var fs = require('fs')
  var path = require('path')

  var config = path.resolve(__dirname + '/../../config.json')

  // Check we have a config.
  fs.exists(config, function(config_does_exist) {

  })
}
