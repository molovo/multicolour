"use strict"

const Http_Error = require("../lib/http-error")
const tape = require("tape-catch")

tape("http error class", test => {
  test.ok(new Http_Error("I'm an error, of the HTTP variety.", 400))
  test.throws(() => new Http_Error("Out of range error code 1", 399), RangeError, "Status code 399 throws error as not valid error status code.")
  test.throws(() => new Http_Error("Out of range error code 1", 501), RangeError, "Status code 501 throws error as not valid error status code.")
  test.end()
})
