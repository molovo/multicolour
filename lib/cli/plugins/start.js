"use strict"

const path = require("path")

class CLI_Start {
  constructor(CLI) {
    this.CLI = CLI
  }

  program() {
    // Set up the start command.
    this.CLI.program
      .command("start [file]")
      .option("-f, --file <file>", "Specific file to start your service with.")
      .description("Start your Multicolour based service(s).")
      .action(this.run.bind(this))
  }

  run(file) {
    const pkg = this.CLI.__scope.get("package")
    const config = pkg.multicolour

    // Check we have a combination of what we need.
    if (!pkg.hasOwnProperty("multicolour") && !file) {
      /* eslint-disable */
      console.error("You asked me to start your service. I can't find config in package.json and you didn't supply a file to start")
      console.error("multicolour start <file> if you want to run a specific file and multicolour start if you have config available in your package.json")
      console.info("https://getmulticolour.com/docs/0.6.3/cli/#multicolour-start")
      /* eslint-enable */

      return this
    }

    // If we're starting a file, just start it.
    if (file || config.script) require(path.resolve(file || config.script))
    else {
      const multicolour = require("../../../index")
      const plugins = config.plugins || []

      // Where's the config?
      if (!config.hasOwnProperty("config") && !config.hasOwnProperty("script")) {
        /* eslint-disable */
        console.error("Missing a config path or config object in your package.json.")
        console.info("https://getmulticolour.com/docs/latest/cli/#start")
        /* eslint-enable */

        return this
      }
      else if (typeof config.config === "string") {
        const service = multicolour.new_from_config_file_path(config.config).scan()

        // Register the plugins.
        plugins.forEach(plugin => {
          this.CLI.debug(`Registering plugin "${JSON.stringify(plugin)}"`)

          if (typeof plugin === "string") {
            service.use(this.require_plugin(plugin))
          }
          else {
            // Register the plugin.
            service.use(this.require_plugin(plugin.name))

            // Register the sub plugins.
            plugin.plugins.forEach(sub_plugin => {
              this.CLI.debug(`Registering plugin "${sub_plugin}" to "${plugin.as || plugin.name}"`)
              service.get(plugin.as || plugin.name).use(this.require_plugin(sub_plugin))
            })
          }
        })


        service.start()
          .then(() => {
            if (service.get("env") !== "production") {
              /* eslint-disable */
              console.log()
              console.log(`Server started, go to ${service.get("server").get("api_root")}/docs`)
              console.log()
              /* eslint-enable */
            }
            else {
              /* eslint-disable */
              console.log()
              console.log("Service started, environment is production so /docs has been disabled.")
              console.log()
              /* eslint-enable */
            }
          })
          .catch(err => {
            /* eslint-disable */
            console.error("An error occured while starting your service.")
            console.error(err)
            /* eslint-enable */
          })
      }

      return this
    }


    return this
  }

  require_plugin(plugin) {
    let path

    if (typeof plugin === "string" && !plugin.match(/^\.{0,2}?\//gi))
      path = this.resolve_relative_path("/node_modules/" + plugin)
    else if (typeof plugin === "string" && plugin.match(/^\.{0,2}?\//gi))
      path = this.resolve_relative_path(plugin)
    else
      path = this.resolve_relative_path("/node_modules/" + plugin.name)

    return require(path)
  }

  resolve_relative_path(resolvable) {
    return require.resolve(process.cwd() + resolvable)
  }
}

module.exports = CLI_Start
