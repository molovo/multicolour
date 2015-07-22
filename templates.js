/**
 * I like the function template pattern for this
 * because it makes things a lot simpler to read.
 *
 * It does however mean that it's harder to follow,
 * less an A -> B -> C follow pattern but an A.call(B).call(C)
 * pattern. Remember, these are function templates.
 */
'use strict'

function notAuthedReply(request, reply) {
  return reply({
    code: 401,
    error: 'Authentication credentials were missing or incorrect.'
  }).code(401)
}

function errorReply(err, reply) {
  return reply({
    code: err.code || 500,
    error: err.message || err
  }).code(err.code || 500)
}

module.exports = {
  get: (request, reply) => {
    console.log('AUTH ERROR', request.auth)
    if (!request.auth.isAuthenticated && request.url.auth)
      notAuthedReply(request, reply)
    else
      this.find().exec((err, models) => {
        if (err) errorReply(err, reply)
        else reply(models).code(200)
      })
  },

  create: (request, reply) => {
    if (!request.auth.isAuthenticated && request.url.auth)
      notAuthedReply(request, reply)
    else if (!request.payload)
      errorReply({ message: 'No content', code: 204 }, reply)
    else this.create(request.payload, (err, model) => {
      if (err) errorReply(err, reply)
      else reply(model).code(201)
    })
  },

  update: (request, reply) => {
    delete request.payload.id

    if (!request.auth.isAuthenticated && request.url.auth)
      notAuthedReply(request, reply)
    else if (!request.payload)
      errorReply({ message: 'No content', code: 204 }, reply)
    else this.update(request.params.id, request.payload, (err, model) => {
      if (err) errorReply(err, reply)
      else reply(model).code(202)
    })
  },

  delete: (request, reply) => {
    if (!request.auth.isAuthenticated && request.url.auth)
      notAuthedReply(request, reply)
    else if (!request.payload)
      errorReply({ message: 'No content', code: 204 }, reply)
    else this.destroy(request.params.id, (err, model) => {
      if (err) errorReply(err, reply)
      else reply({}).code(410)
    })
  }
}
