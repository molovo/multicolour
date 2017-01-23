"use strict"

// Get the testing library.
const tape = require("tape")

// Get Multicolour.
const Multicolour = require("../index")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

tape("Default, basic HTTP server starts and stops without error.", test => {
  // Create an instance of multicolour.
  const multicolour = new Multicolour({content: test_content_path}).scan()

  const server = multicolour.get("server")

  server.start()
    .then(() => test.pass("Default, basic server starts without error."))
    .then(() => {
      server.stop()
        .then(() => {
          test.pass("Default, basic server stops without error.")
          test.end()
        })
        .catch(err => {
          test.fail(err.message)
          test.end()
        })
    })
    .catch(err => {
      test.fail(err.message)
      test.end()
    })
})
