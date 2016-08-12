"use strict"

class Plugin {
  register(multicolour) {
    // Get a name, derived from the plugin's name
    // and fall back to a random UUID.
    const name = this.constructor.name || multicolour.request("new_uuid")
    multicolour.set(name, name)

    // Exit.
    return this
  }
}

module.exports = Plugin
