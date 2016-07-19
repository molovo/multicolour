"use strict"

/**
 * A simple map of verbs to http verbs.
 */
module.exports = {
  // CREATE
  create: "post",
  new: "post",
  post: "post",

  // READ
  get: "get",
  read: "get",

  // UPDATE
  change: "patch",
  update: "patch",
  updateOrCreate: "put",
  "update or create": "put",

  // DELETE
  delete: "delete",
  remove: "delete",
  destroy: "delete"
}
