"use strict"

// Configure our service.
const my_service = require("multicolour")
  // Configure the service core and scan for content.
  .new_from_config_file_path("./config.js")
  .scan()

  // Register the server plugin.
  .use(require("{{SERVER}}"))

  {{AUTH}}

// Start the service.
my_service.start(() => {
  console.log(`Server started, go to ${my_service.get("server").get("api_root")}/docs`);
})
