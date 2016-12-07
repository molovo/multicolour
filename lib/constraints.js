"use strict"

/**
 * A constraint is a code-less way to create business logic.
 *
 * A constraint has this format:
 *    {
 *      [key String]: [Function|ComparativeString|ConstraintObject]
 *    }
 *
 * Where:
 *    key String is the name of the field to constrain
 *    Function is an executable function that returns a native type (String, Number, null)
 *    ComparativeString path to a value in the request object to constrain by, string format is ([comparative? ]object.path)
 *    ConstraintObject with the following structure:
 *        {
 *          [key String]: {
 *            compile: Bool false,
 *            value: compile ? ComparativeString : (Native String|Number|null)
 *          },
 *        }
 *
 * Examples:
 *    1.
 *      { role: "auth.session.role" }
 *    2.
 *      {
 *        name: {
 *          compile: false,
 *          value: "Multicolour"
 *        }
 *      }
 *    3.
 *      {
 *        createdAt: ">= " + new Date(2015)
 *      }
 *    4.
 *      {
 *        age: {
 *          compile: false,
 *          value: ">= 18"
 *        }
 *      }
 *
 * Thoughts for future versions:
 * 1) and|or clauses
 *
 */

const debug = require("debug")
const jsocrud = require("jsocrud")
const deprecate = require("util").deprecate

class Constraints {

  constructor() {
    this.debug = debug("multicolour:constraints")
  }

  /**
   * Set the source for the compiler
   * to resolve from when creating the
   * outward object.
   *
   * @param {Object} source to resolve from.
   * @return {Constraints} this instance of Constraints.
   */
  set_source(source) {
    this.source = source
    return this
  }

  /**
   * Set the rules for the compiler
   * to resolve when creating the
   * outward object.
   *
   * @param {Object} source to resolve from.
   * @return {Constraints} this instance of Constraints.
   */
  set_rules(rules) {
    this.rules = rules
    return this
  }

  /**
   * Get the actual value of the constraint from
   * the source (or the rules) and return any
   * comparitive operators as well.
   *
   * @param {String|Object} value to get comparitives and values from.
   * @return {Object} Object with values and comparitives keys.
   */
  value_from_value(value) {
    // Check we got a value at all.
    if (typeof value === "undefined")
      throw new ReferenceError("Malformed constraint, no value.")

    // The supported comparative operations.
    const comparatives = new Map([
      ["<", "<"],
      [">", ">"],
      ["<=", "<="],
      [">=", ">="],
      ["!", "!"],
      ["^", "startsWith"],
      ["$", "endsWith"],
      ["%", "like"]
    ])

    // Split the value.
    const parts = value.split(" ")

    // Check we don't have too many parts.
    if (parts.length > 2)
      throw new Error(`Malformed constraint, too many parts (${parts.length} > 2). ([comparative? ]object.path)`)

    // If we have 2 parts, we likely have a comparative and a value.
    if (parts.length === 2) {
      if (!comparatives.has(parts[0]))
        throw new Error(`Malformed constraint, unknown comparative operation (${parts[0]})`)
      else
        return {
          comparative: comparatives.get(parts[0]),
          value: parts[1]
        }
    }
    else {
      return {
        comparative: null,
        value: parts[0]
      }
    }

  }

  /**
   * Compile any constraints and return an object.
   * @return {Object} compiled constraints.
   */
  compile() {
    // The query.
    const query = {}

    // Loop over each constraint and compile it's path.
    Object.keys(this.rules).forEach(key => {
      // Get the constraint.
      const constraint = this.rules[key]

      // If it's a function, execute it.
      if (constraint instanceof Function) {
        query[key] = deprecate(
          constraint.bind(this, this.source, this.rules),
          /* eslint-disable */
          // ESLint disabled because this message is too long. Only around for a minor version.
          "Function constraints were deprecated in 0.5.0. They will continue to function until version 0.6.0. Please write your own handler."
          /* eslint-enable */
        )()
      }
      else {
        // If it's undefined, just set it.
        if (typeof constraint === "undefined") {
          query[key] = constraint
        }
        else {
          const parts = this.value_from_value(constraint.hasOwnProperty("value") ? constraint.value : constraint)

          if (!constraint.compile && constraint.hasOwnProperty("value")) {
            if (parts.comparative)
              query[key] = {[parts.comparative]: parts.value}
            else
              query[key] = parts.value
          }
          // It's probably something for jsocrud to handle then.
          else {
            const deep_value = jsocrud.get(this.source, parts.value, null)
            if (parts.comparative)
              query[key] = {[parts.comparative]: deep_value}
            else
              query[key] = deep_value
          }
        }
      }
    })

    // Debugging.
    this.debug("Constraints compiled as %s", JSON.stringify(query, null, 2))

    // Set the results.
    this.results = query

    return this
  }
}

module.exports = Constraints
