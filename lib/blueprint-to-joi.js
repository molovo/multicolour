/**
 * Waterline doesn't currently support
 * nested object validation and why would it?
 * any SQL doesn't support nested objects
 * so right now, we're going to fudge what
 * we can until a good solution is available.
 *
 * This can be MUCH better, I'm keepin' it simple and stupid fo'now yo.
 *
 * Dave Mackintosh - 27 Jul 2015
 */
'use strict'

// Get the Joi library.
let Joi = require('joi')

// Stolen from
//  http://stackoverflow.com/a/25715455/871617
function isObject (item) {
  return (typeof item === "object" && !Array.isArray(item) && item !== null);
}

function convert(object) {
  // What we'll populate to create the object
  let keys_not_in = [ 'updatedAt', 'createdAt', 'id', '_id' ]
  let key_out = {}
  let out_schemas = {
    in: Joi.object(),
    out: Joi.object()
  }

  // Start converting by looping over the keys.
  Object.keys(object).forEach(function(property_name) {
    // Get the property.
    let prop = object[property_name]

    // Set up the new key.
    key_out[property_name] = Joi

    // If it's a function, just use that for this validation.
    if (prop instanceof Function) key_out[property_name] = key_out[property_name].func(prop)
    // If it's just a type, just do that.
    else if (!isObject(prop)) key_out[property_name] = key_out[property_name][prop]()

    // Fire the correct type function for joi.
    switch (prop.type) {
      case "integer":
        key_out[property_name] = key_out[property_name].number()
      break
      case "datetime":
        key_out[property_name] = key_out[property_name].date()
        // If the default is 'now' then set up a function to actually
        // return the current date rather than a compile time static date
        // See https://github.com/hapijs/joi/issues/363
        if (typeof prop.default === "string" && prop.default.toLowerCase() === 'now')
          prop.default = function() { return new Date() }
      break
      case "autoIncrement":
      case "primaryKey":
      case "unique":
      case "index":
      case undefined:
        // Do nothing with these prop types.
      break
      default:
        key_out[property_name] = key_out[property_name][prop.type]()
    }

    // If it's required, make it so.
    if (prop.required === true) key_out[property_name] = key_out[property_name].required()

    // If there's a default, set it up.
    if (prop.default)
      key_out[property_name] = key_out[property_name].default(prop.default, 'something')

    // If there are any maxs or mins, apply the same in joi.
    if (prop.hasOwnProperty('minLength') || prop.hasOwnProperty('min'))
      key_out[property_name] = key_out[property_name].min(Number(prop.minLength || prop.min))

    if (prop.hasOwnProperty('maxLength') || prop.hasOwnProperty('max'))
      key_out[property_name] = key_out[property_name].max(Number(prop.maxLength || prop.max))
  })

  // If it's an array, wrap the element.
  out_schemas.out = out_schemas.out.keys(key_out)

  // Delete some bad stuff and apply to the inward based schemas.
  keys_not_in.map(key => {
    delete key_out[key]
  })

  out_schemas.in = out_schemas.in.keys(key_out)

  return out_schemas
}

module.exports = convert
