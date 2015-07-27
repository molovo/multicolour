/**
 * Waterline doesn't currently support
 * nested object validation and why would it?
 * any SQL doesn't support nested objects
 * so right now, we're going to fudge what
 * we can until a good solution appears.
 *
 * This can be MUCH better, I'm keepin' it simple fo'now yo.
 *
 * 27 Jul 2015
 */

// Get the Joi library.
var Joi = require('joi')

// Stolen from
//  http://stackoverflow.com/a/25715455/871617
function isObject (item) {
  return (typeof item === "object" && !Array.isArray(item) && item !== null);
}

function convert(object, array) {
  // What we'll populate.
  var joi_out = Joi.object()
  var key_out = {}

  // Start converting by looping over the keys.
  Object.keys(object).forEach(function(property_name) {
    var prop = object[property_name]
    key_out[property_name] = Joi

    // If it's a function, just use that for this validation.
    if (prop instanceof Function) return joi_out = Joi.func(prop)
    // If it's just a type, just do that.
    else if (!isObject(prop)) return key_out[property_name][prop]()

    // Otherwise, make the conversion out of all available properties.
    if (prop.required === true) key_out[property_name].required()

    // Fire the type function for joi.
    // NOTE: Joi has number().integer() and AFAIK Waterline only has integer,
    // so remap to the number function for Joi.
    console.log(prop.type === "integer")
    if (prop.type === "integer") key_out[property_name].number()
    else key_out[property_name][prop.type]()

    console.log(key_out[property_name])

    // If there are any maxs or mins, apply the same in joi.
    if (prop.hasOwnProperty('minLength') || prop.hasOwnProperty('min'))
      key_out[property_name].min(prop.minLength)

    if (prop.hasOwnProperty('maxLength') || prop.hasOwnProperty('max'))
      key_out[property_name].max(prop.maxLength)
  })

  // If it's an array, wrap the element.
  if (array) joi_out = joi.array().items(joi_out)

  joi_out.keys(key_out)

  console.log(joi_out)

  return joi_out
}

module.exports = convert
