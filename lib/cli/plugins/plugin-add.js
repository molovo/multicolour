"use strict"

const fs = require("fs-extra")

/**
 * Ask a series of questions then act upon the developers answers.
 *
 * @param  {String} init_path from the CLI.
 * @return {cli} Object for chaining.
 */
class CLI_Plugin_Add {
  constructor(CLI) {
    this.CLI = CLI
  }

  program() {
    // Set up the init command.
    this.CLI.program
      .command("plugin-add [name]")
      .description("Add a new plugin to your REST API")
      .option("-uo, --unofficial", "Don't search with the prefix 'multicolour-' (officially supported plugins)")
      .action(this.run.bind(this))
      .on("--help", () => {
        /* eslint-disable */
        console.log("Examples:")
        console.log()
        console.log("    multicolour plugin-add hapi-jwt - will install multicolour-auth-oauth")
        console.log("    multicolour plugin-add my-awesome-plugin --unofficial - will install my-awesome-plugin")
        console.log("    multicolour https://github.com/Multicolour/multicolour-seed.git - will install multicolour-seed")
        console.log()
        /* eslint-enable */
      })
  }

  run(plugin_name, options) {
    const multicolour = this.CLI.__scope
    const exec = require("child_process").exec
    const RegClient = require("npm-registry-client")
    const client = new RegClient()
    const user_package = multicolour.get("package")

    // Do we need to suffix the plugin name?
    if (!plugin_name.startsWith("multicolour-") && !options.unofficial && !plugin_name.startsWith("http"))
      plugin_name = "multicolour-" + plugin_name

    // The url to the package we're going to try.
    const uri = "https://registry.npmjs.org/" + plugin_name

    // Try the registry first.
    client.get(uri, {}, (error, data) => {
      /* eslint-disable */
      if (error) console.error(error)
      /* eslint-enable */
      else {
        // It all went okay and we can install the
        // plugin and save it to the project dependencies.
        exec(`npm i -S ${plugin_name}@${data["dist-tags"].latest}`, (error, stdout, stderr) => {
          /* eslint-disable */
          if (error || stderr) console.error(error || stderr)
          else console.log(stdout)
          /* eslint-enable */

          // Is it a server plugin?
          if (plugin_name.startsWith("multicolour-hapi")) {
            user_package.multicolour.plugins.forEach(plugin => {
              if (typeof plugin !== "string")
                if (plugin.as && plugin.as === "server")
                  plugin.plugins.push(plugin_name)
            })
          }
          // Or a CLI plugin?
          else if (plugin_name.startsWith("multicolour-cli")) {
            user_package.multicolour.plugins.forEach(plugin => {
              if (typeof plugin !== "string")
                if (plugin.as && plugin.as === "cli")
                  plugin.plugins.push(plugin_name)
            })
          }
          // Or just a core plugin.
          else user_package.multicolour.plugins.push(plugin_name)

          // Was the service started with a config file location?
          if (multicolour.get("package_path")) {
            fs.writeFile(multicolour.get("package_path"), JSON.stringify(user_package), err => {
              /* eslint-disable */
              if (err) console.error(err)
              else console.log("Updated your package.json successfully")
              /* eslint-enable */
            })
          }
        })
      }
    })
  }
}

module.exports = CLI_Plugin_Add
