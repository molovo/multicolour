// Get the Joi library.
var joi = require('joi')

// Stolen from
//  http://stackoverflow.com/a/25715455/871617
function isObject (item) {
  return (typeof item === "object" && !Array.isArray(item) && item !== null);
}

function convert(object, array) {
  // What we'll populate.
  var out = joi.object()

  // Start converting.
  Object.keys(object).forEach(function(key) {
    // console.log(object[key])
  })

  // If it's an array, wrap the element.
  if (array)
    out = joi.array().items(out)

  return out
}

module.exports = convert
