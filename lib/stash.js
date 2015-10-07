"use strict"

const Talkie = require("@newworldcode/talkie")

class stash {
  constructor() {
    this.__data = new Map()
  }

  set(what, value) {
    this.__data.set(what, value)
    return this
  }

  get(what) {
    return this.__data.get(what)
  }
}

Talkie().extend(stash)

module.exports = stash
