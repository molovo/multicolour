"use strict"

const Talkie = require("@newworldcode/talkie")

class stash {
  constructor() {
    this.__data = new Map()
  }
}

Talkie().extend(stash)

module.exports = stash
