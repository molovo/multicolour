"use strict"

const http = require("http")

class Multicolour_Default_Server {
  register(multicolour) {
    this.multicolour = multicolour

    // Register.
    multicolour.set("server", this)
  }

  start() {
    // Simply forward the request and responder
    // into an app wide event.
    this.handler = (request, response) =>
      this.multicolour.trigger("raw_http_request", {request, response})

    // Create the server.
    this.server = http.createServer(this.handler)

    return new Promise((resolve, reject) => {
      try {
        this.server.listen(this.multicolour.get("config").get("http_port") || 1811)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  stop() {
    return new Promise((resolve, reject) => {
      try {
        if (this.server) this.server.close(resolve)
        else resolve()

        delete this.server
      } catch (error) {
        reject(error)
      }
    })
  }
}

module.exports = Multicolour_Default_Server
