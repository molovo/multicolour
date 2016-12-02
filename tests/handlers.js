"use strict"

// Get the testing library.
const tape = require("tape")
const Async = require("async")

// Get Multicolour.
const Multicolour = require("../index")
const Http_Error = require("../lib/http-error")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

// Create an instance of multicolour.
const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js").scan()

tape("Handlers", test => {
  multicolour.start(() => {
    const model = multicolour.get("database").get("models").test
    const handlers = Multicolour.handlers

    const constraints = {user: "payload.user"}

    test.doesNotThrow(() => handlers.set_host(multicolour), "Doesn't throw error when setting host for handlers.")
    test.doesNotThrow(() => handlers.collection_has_associations(model), "Doesn't throw error while checking for associations on a collection.")

    test.deepEquals(handlers.compile_constraints({payload: {user: 1}}, constraints), {user: 1}, "Doesn't throw error while compiling constraints")
    test.deepEquals(handlers.compile_constraints({payload: {user: 1}}, null), {}, "Exits with no constraints passed in.")
    test.deepEquals(handlers.compile_constraints({payload: {user: 1}}, {user: () => 1}), {user: 1}, "Executes the function in a constraint.")
    test.deepEquals(handlers.compile_constraints({payload: {user: 1}}, {user: {compile: false, value: 1}}), {user: 1}, "Executes and non-compilable a constraint.")
    test.deepEquals(handlers.compile_constraints({payload: {user: 1}}, {user: {compile: true, value: "payload.user"}}), {user: 1}, "Executes and compiles a constraint.")

    handlers.compile_constraints({payload: {user: 1}}, constraints)
    test.deepEquals(handlers.compile_constraints({payload: {user: 1}}, constraints), {user: 1}, "Doesn't throw error while compiling constraints")

    const url = {query: {}}
    const payload = {name: "test", age: 12}

    Async.series([
      next => handlers.POST.call(model, {
        payload,
        params: {},
        url
      }, (err, created) => {
        test.equal(err, null, "No error in POST handler.")
        test.equal(created.length, 1, "Returned 1 created document")
        next()
      }),
      next => handlers.GET.call(model, {params: {}, url}, (err, rows) => {
        test.equal(err, null, "No error in empty GET handler")
        test.equal(rows.length, 1, "Returned 1 document")
        next()
      }),
      next => handlers.GET.call(model, {params: {id: 1}, url}, (err, rows) => {
        test.equal(err, null, "No error in GET handler with id.")
        test.equal(rows.length, 1, "Returned 1 document")
        next()
      }),
      next => handlers.GET.call(model, {params: {id: 999}, url}, err => {
        test.ok(err, "Expected error in GET handler with bad id.")
        test.equal(err.code, 404, "Returned a 404")
        next()
      }),
      next => handlers.PATCH.call(model, {payload, params: {id: 1}, url}, err => {
        test.equal(err, null, "No error in PATCH handler with id.")
        next()
      }),
      next => handlers.DELETE.call(model, {params: {id: 1}, url}, err => {
        test.equal(err, null, "No error in DELETE handler with id.")
        next()
      }),
      next => handlers.DELETE.call(model, {params: {id: 999}, url}, err => {
        test.ok(err instanceof Http_Error, "Get an error which is a HTTP document gone status.")
        test.equal(err.code, 410, "Document gone status code.")
        next()
      }),
      next => handlers.PUT.call(model, {params: {id: 2}, payload, url}, err => {
        test.equal(err, null, "No error in PUT handler with id.")
        next()
      }),
      next => handlers.PUT.call(model, {params: {id: 2}, payload, url}, err => {
        test.equal(err, null, "No error in PUT handler with newly created record.")
        next()
      }),
      next => handlers.UPLOAD.call(model, {
        params: {id: 999},
        payload: {
          file: {
            filename: test_content_path + "circle.svg",
            path: test_content_path + "circle.svg"
          }
        }, url}, err => {
          test.ok(err, "Expected error in UPLOAD handler when row not found.")
          test.equal(err.code, 404, "Get a 404 for trying to upload to unknown row")
          next()
        }),
      next => handlers.UPLOAD.call(model, {
        params: {id: 2},
        payload: {
          file: {
            filename: test_content_path + "circle.svg",
            path: test_content_path + "circle.svg"
          }
        }, url}, err => {
          test.equal(err, null, "No error in UPLOAD handler.")
          next()
        })
    ], multicolour.stop.bind(multicolour, test.end.bind(test)))
  })
})
