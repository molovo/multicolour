"use strict"

class Http_Error extends Error {
  /**
   * Create a structure that can be used for
   * http friendly errors throught the handlers.
   * @param  {String} message to show.
   * @param  {Number} code to emit in the response, i.e 403, 404
   * @return {Http_Error} this instance.
   */
  constructor(message, code) {
    // Create the parent Error.
    super(message)

    // Check the code is within range of a standard http error.
    if (code < 400 || code > 500) {
      throw new RangeError("Error code to throw not within valid http error range.")
    }

    // Add the code.
    this.code = code

    // Exit.
    return this
  }
}

module.exports = Http_Error
