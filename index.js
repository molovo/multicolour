// This is a library that does a heap of
// stuff for you automatically like generate
// Waterline collections, Hapi JS routes and
// Backbone models/collections/routes.
//
// This file just imports core modules for exporting
// and preparation of your code.

// Boot up the app.
var Bootup = require('./core/bootup')

module.exports = {
  Start: Bootup
}
