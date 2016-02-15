"use strict"

// Get the testing library.
const tape = require("tape")

// Get Multicolour.
const Multicolour = require("../index.js")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

tape("Waterline collections are created by Multicolour on instantiation and we only get expected errors.", test => {
  test.plan(12)

  // Create an instance of multicolour.
  const multicolour = new Multicolour({
    content: test_content_path,
    db: {
      adapters: {
        development: require("sails-memory")
      },
      connections: {
        development: {
          adapter: "development"
        }
      }
    }
  }).scan()

  test.notEquals(typeof multicolour.get("blueprints"), "undefined", "Blueprints exists")
  test.notEquals(typeof multicolour.get("database"), "undefined", "Database exists")

  // Seed for some more tests.
  multicolour.get("database").start(ontology => {
    const models = ontology.collections

    models.test.create({ name: "test", age: 100, empty: null }, (err, t) => {
      test.equal(err, null, "No error during 1st seed")
      test.doesNotThrow(() => t.toJSON(), "Called toJSON on test")
    })
    models.test2.create({ name: "test", age: 100 }, (err, t) => {
      test.equal(err, null, "No error during 2nd seed")
      test.doesNotThrow(() => t.toJSON(), "Called toJSON on test2")
    })
    models.multicolour_user.create({
      username: "test",
      name: "test",
      password: "password"
    }, (err, user) => {
      test.equal(err, null, "No error during 3rd seed")
      test.doesNotThrow(() => user.toJSON(), "Called toJSON on user")
    })
    models.multicolour_user.create({
      username: "test2",
      name: "test2",
      email: null
    }, (err, user) => {
      test.equal(err, null, "No error during 4th seed")
      test.doesNotThrow(() => user.toJSON(), "Called toJSON on user without password")
    })
  })

  test.throws(() => multicolour.get("database").start(), TypeError, "Should throw without a callback.")

  delete multicolour.get("config").delete("db")
  test.throws(() => multicolour.get("database").start(err => {throw err}), Error, "Should throw without proper config.")

  // Reset Multicolour
  multicolour.reset()
})
