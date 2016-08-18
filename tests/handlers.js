"use strict"

// Get the testing library.
const tape = require("tape-catch")
const Async = require("async")

// Get Multicolour.
const Multicolour = require("../index")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

// Create an instance of multicolour.
const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js").scan()

tape("Handlers", test => {
  test.plan(11)

  multicolour.start(() => {
    const model = multicolour.get("database").get("models").test
    const handlers = Multicolour.handlers

    const constraints = { user: "payload.user" }

    test.doesNotThrow(() => handlers.set_host(multicolour), "Doesn't throw error when setting host for handlers.")
    test.doesNotThrow(() => handlers.collection_has_associations(model), "Doesn't throw error while checking for associations on a collection.")
    test.deepEquals(handlers.compile_constraints({ payload: { user: 1 } }, constraints), { user: 1 }, "Doesn't throw error while compiling constraints")

    const url = {query: {}}
    const payload = { name: "test", age: 12 }

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
      next => handlers.GET.call(model, { params: {}, url }, (err, rows) => {
        test.equal(err, null, "No error in empty GET handler")
        test.equal(rows.length, 1, "Returned 1 document")
        next()
      }),
      next => handlers.GET.call(model, { params: { id:1 }, url }, (err, rows) => {
        test.equal(err, null, "No error in GET handler with id.")
        test.equal(rows.length, 1, "Returned 1 document")
        next()
      }),
      next => handlers.PATCH.call(model, { payload, params: { id:1 }, url }, err => {
        test.equal(err, null, "No error in PATCH handler with id.")
        next()
      }),
      next => handlers.DELETE.call(model, { params: { id:1 }, url }, err => {
        test.equal(err, null, "No error in PATCH handler with id.")
        next()
      })
    ], multicolour.stop.bind(multicolour))

    // Async.parallel([
      // next => test.doesNotThrow(() => handlers.PATCH.call(model, request, err => {
      //   if (err) throw err
      //   next()
      // }), "No error in PATCH handler"),
      // next => test.doesNotThrow(() => handlers.DELETE.call(model, request, err => {
      //   if (err) throw err
      //   next()
      // }), "No error in DELETE handler"),
      // next => test.doesNotThrow(() => handlers.PUT.call(model, request, err => {
      //   if (err) throw err
      //   next()
      // }), "No error in PUT handler"),
      // next => {
      //   request.payload = {}
      //   request.params = {}
      //   test.doesNotThrow(() => handlers.GET.call(model, request, err => {
      //     if (err) throw err
      //     next()
      //   }), "No error in GET handler")
      // }
    // ], test.end.bind(test)))
  })
})
