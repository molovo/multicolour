"use strict"

// Get the testing library.
const tape = require("tape")
const Constraints = require("../lib/constraints")
const source = {
  request: {
    payload: {
      user: "dave",
      age: 28,
      dob: new Date(1988, 11, 18)
    }
  }
}

tape("Compile basic constraint.", assert => {
  assert.plan(4)

  const query = new Constraints()

  assert.doesNotThrow(() => query.set_source(source), "Doesn't throw while setting source")
  assert.doesNotThrow(() => query.set_rules({name: "request.payload.user"}), "Does not throw while setting rules.")
  query.compile()
  assert.doesNotThrow(() => query.compile(), "Does not throw while compiling constraints.")
  assert.deepEquals(query.results, {name: "dave"}, "The compiled constraint is as expected.")
})

tape("Compile comparitive constraints.", assert => {
  assert.plan(21)

  const query = new Constraints()

  assert.doesNotThrow(() => {
    query
      .set_source({
        request: {
          payload: {
            user: "dave",
            age: 0,
            dob: new Date(1970)
          }
        }
      })
  }, "Doesn't throw while setting source")

  query.set_rules({name: "request.payload.user"})
  assert.doesNotThrow(() => query.compile(), "Does not throw while compiling name constraint.")
  assert.deepEquals(query.results, {name: "dave"}, "Compiled constraint is as expected (basic).")

  query.set_rules({age: "> request.payload.age"})
  assert.doesNotThrow(() => query.compile(), "Does not throw while compiling age constraint.")
  assert.deepEquals(query.results, {age: {">": 0}}, "Compiled constraint is as expected (> int).")

  query.set_rules({age: ">= request.payload.age"})
  assert.doesNotThrow(() => query.compile(), "Does not throw while compiling age constraint.")
  assert.deepEquals(query.results, {age: {">=": 0}}, "Compiled constraint is as expected (>= int).")

  query.set_rules({dob: "> request.payload.dob"})
  assert.doesNotThrow(() => query.compile(), "Does not throw while compiling dob constraint (greater than date).")
  assert.deepEquals(query.results, {dob: {">": new Date(1970)}}, "Compiled constraint is as expected (> date).")

  query.set_rules({dob: ">= request.payload.dob"})
  assert.doesNotThrow(() => query.compile(), "Does not throw while compiling dob constraint (greater than date).")
  assert.deepEquals(query.results, {dob: {">=": new Date(1970)}}, "Compiled constraint is as expected (>= date).")

  query.set_rules({name: {compile: false, value: "^ da"}})
  assert.doesNotThrow(() => query.compile(), "Does not throw while compiling name constraint (starts with 'da').")
  assert.deepEquals(query.results, {name: {"startsWith": "da"}}, "Compiled constraint is as expected (starts with da).")

  query.set_rules({name: {compile: false, value: "$ ve"}})
  assert.doesNotThrow(() => query.compile(), "Does not throw while compiling name constraint (ends with 've').")
  assert.deepEquals(query.results, {name: {"endsWith": "ve"}}, "Compiled constraint is as expected (ends with ve).")

  query.set_rules({name: "! request.payload.user"})
  assert.doesNotThrow(() => query.compile(), "Does not throw while compiling name constraint (not equal to 'dave').")
  assert.deepEquals(query.results, {name: {"!": "dave"}}, "Compiled constraint is as expected (not equal to 'dave').")

  query.set_rules({name: () => "dave"})
  assert.doesNotThrow(() => query.compile(), "Does not throw while running function constraint")
  assert.deepEquals(query.results, {name: "dave"}, "Compiled constraint is as expected (function return equal to 'dave').")

  query.set_rules({name: {value: "dave"}})
  assert.doesNotThrow(() => query.compile(), "Does not throw while running function constraint")
  assert.deepEquals(query.results, {name: "dave"}, "value, compiled constraint name equal to dave.")
})

tape("Constraint error handlers", assert => {
  assert.plan(5)

  const query = new Constraints()

  assert.doesNotThrow(() => query.set_source({request: {payload: {user: "dave"}}}), "Doesn't throw while setting source")

  query.set_rules({name: {value: "! ! dave"}})
  assert.throws(() => query.compile(), Error, "Throws with malformed constraint.")

  query.set_rules({name: {value: "? dave"}})
  assert.throws(() => query.compile(), Error, "Throws with unknown comparative symbol.")

  query.set_rules({name: undefined})
  assert.doesNotThrow(() => query.compile(), "Does not throw when constraint value is undefined")
  assert.throws(() => query.value_from_value(undefined), ReferenceError, "Throws with undefined value in rules.")
})
