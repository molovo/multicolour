"use strict"

// For path resolution.
const path = require("path")
const fs = require("fs-extra")
const mkdirp = require("mkdirp")
const chalk = require("chalk")
const debug = require("debug")
const inquirer = require("inquirer")

// Get the nice name/version dictionary.
const db_module_table = require("./db-module-table")

class cli extends Map {
  /**
   * Set up commander to accept the various
   * arguments and commands that make multicolour
   * easy to get started with.
   * @return {multicolour} Object for chaining.
   */
  constructor() {
    super()

    this.debug = debug("multicolour:cli")

    // Create a program.
    this.program = require("commander")

    // Set up the start command.
    this.program
      .command("start [file]")
      .option("-f, --file <file>", "Specific file to start your service with.")
      .description("Start your Multicolour based service(s).")
      .action(this.start.bind(this))

    // Set up the init command.
    this.program
      .command("init [target]")
      .alias("I")
      .description("Create a new Multicolour project in the target directory and start the wizard.")
      .option("-t, --target <dir>", "Where to init.", "./")
      .action(this.init.bind(this))

    // Set up the init command.
    this.program
      .command("version")
      .description("Show the version of Multicolour installed.")
      /* eslint-disable */
      .action(() => console.log(require("../package.json").version))
      /* eslint-enable */

    // Set up the init command.
    this.program
      .command("plugin-add [name]")
      .description("Add a new plugin to your REST API")
      .option("-np, --no_prefix", "Don't search with the prefix 'multicolour-' (officially supported plugins)")
      .action(this.add_plugin.bind(this))
      .on("--help", () => {
        /* eslint-disable */
        console.log("Examples:")
        console.log()
        console.log("    multicolour plugin-add auth-oauth")
        console.log("    multicolour plugin-add my-awesome-plugin --no-prefix")
        console.log()
        /* eslint-enable */
      })

    // Exit.
    return this
  }

  add_plugin(plugin_name, options) {
    const exec = require("child_process").exec
    const RegClient = require("npm-registry-client")
    const client = new RegClient()

    // Do we need to suffix the plugin name?
    if (!plugin_name.startsWith("multicolour-") && !options.no_prefix && !plugin_name.startsWith("http"))
      plugin_name = "multicolour-" + plugin_name

    const uri = "https://registry.npmjs.org/" + plugin_name

    client.get(uri, {}, (error, data) => {
      /* eslint-disable */
      if (error) console.error(error)
      /* eslint-enable */
      else {
        exec(`npm i -S ${plugin_name}@${data["dist-tags"].latest}`, (error, stdout, stderr) => {
          /* eslint-disable */
          if (error || stderr) console.error(error || stderr)
          else console.log(stdout)
          /* eslint-enable */
        })
      }
    })
  }

  ask_for_default_user(target) {
    /* eslint-disable */
    console.info("These details are for YOUR api, they are not sent anywhere.")
    /* eslint-enable */
    return inquirer.prompt([
      {
        default: "name@domain.com",
        type: "input",
        name: "email",
        message: "Enter an email address"
      },
      {
        default: "",
        type: "password",
        name: "password",
        message: "Enter a password"
      }
    ])
    .then(answers => {
      fs.readFile(require.resolve("../init/default-user.js"), (err, stream) => {
        if (err) throw err

        const file = stream
            .toString()
            .replace("const email = \"\"", `const email = "${answers.email}"`)
            .replace("const password = \"\"", `const password = "${answers.password}"`)

        mkdirp(`${target}/content/plugins/`)

        fs.writeFile(`${target}/content/plugins/default-user.js`, file)
      })
    })
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

  start(file) {
    const pkg = this.__scope.get("package")
    const config = pkg.multicolour

    // Check we have a combination of what we need.
    if (!pkg.hasOwnProperty("multicolour") && !file) {
      /* eslint-disable */
      console.error("You asked me to start your service. I can't find config in package.json and you didn't supply a file to start")
      console.error("multicolour start <file> if you want to run a specific file and multicolour start if you have config available in your package.json")
      console.info("https://getmulticolour.com/docs/latest/cli/#start")
      /* eslint-enable */

      return this
    }

    // If we're starting a file, just start it.
    if (file || config.script) require(path.resolve(file || config.script))
    else {
      const multicolour = require("../index")
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
          this.debug(`Registering plugin "${JSON.stringify(plugin)}"`)

          if (typeof plugin === "string") {
            service.use(this.require_plugin(plugin))
          }
          else {
            // Register the plugin.
            service.use(this.require_plugin(plugin.name))

            // Register the sub plugins.
            plugin.plugins.forEach(sub_plugin => {
              this.debug(`Registering plugin "${sub_plugin}" to "${plugin.as || plugin.name}"`)
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

  resolve_relative_path(resolvable) {
    return require.resolve(process.cwd() + resolvable)
  }

  /**
   * Parse the/any arguments passed
   * through via the cli.
   * @return {cli} Object for chaining.
   */
  parse() {
    // Parse the args.
    this.program.parse(process.argv)

    // Check the length of the arguments passed in
    // so we know whether to show the help message or not.
    if (!process.argv.slice(2).length) {
      this.program.outputHelp()
    }

    // Exit.
    return this
  }

  /**
   * Set the scope of the operations conducted
   * by this instance of the CLI tool.
   * @param  {multicolour} target_multicolour to use as the scope.
   * @return {cli} Object for chaining.
   */
  scope(target_multicolour) {
    // Check we got a target.
    if (!target_multicolour) {
      throw new ReferenceError("Target should be defined to set scope.")
    }

    // Set the scope of this CLI to an instance of Multicolour.
    this.__scope = target_multicolour

    // Return for chaining.
    return this
  }

  /**
   * Ask a series of questions then act upon the developers answers.
   * @param  {Commander} command executing this function.
   * @param  {Object} options passed in via the CLI
   * @return {cli} Object for chaining.
   */
  init(init_path) {
    init_path = "."

    // We need to validate the package name for npm.
    const valid_name = require("validate-npm-package-name")

    // Get the path to the target.
    const target = path.resolve(init_path)

    // Add this to the instance so we can access later.
    this.write_path = target

    // Set up some things we need to function well.
    this.set("init_target", target)

    inquirer.prompt([
      {
        default: "n",
        type: "input",
        name: "confirmed",
        message: `Will create a project in "${target}", will overwrite any existing project. Continue?`,
        validate: is_okay => {
          if (is_okay.toLowerCase() === "no" || is_okay.toLowerCase() === "n")
            process.exit(0)
          else
            return true
        }
      },
      {
        type: "input",
        name: "project_name",
        message: "Enter your project's name (no spaces or special characters):",
        default: path.basename(target.replace(/\s+/, "-")).toLowerCase(),
        validate: value =>
          valid_name(value).validForNewPackages
            ? true
            : "Project name is invalid, check it doesn't contain spaces or special characters."
      },
      {
        type: "input",
        name: "description",
        message: "Enter your project's description:"
      },
      {
        type: "confirm",
        name: "seed",
        message: "Do you want to seed your database with random data?",
        default: false
      },
      {
        type: "list",
        name: "database",
        message: "What database technology would you like to use?",
        default: "postgresql",
        choices: Object.keys(db_module_table)
      },
      {
        type: "checkbox",
        name: "authentication",
        message: "What authentication do you want for your API?",
        choices: [
          "JWT", "Twitter", "Facebook", "GitHub", "Google", "Instagram", "LinkedIn",
          "Yahoo", "Foursquare", "VK", "ArcGIS Online", "Windows Live", "Nest",
          "Phabricator", "BitBucket", "Reddit", "Tumblr"
        ]
      }
    ]).then(this._deal_with_init_answers.bind(this))

    return this
  }

  /**
   * Write a formatted JSON file based on a series
   * of answers from the developer.
   * @param  {Object} answers given by the developer.
   * @return {void}
   */
  write_package_json_file(answers) {
    /* eslint-disable */
    console.info("Writing package.json")
    /* eslint-enable */

    // Get the target init directory.
    const target = this.get("init_target")

    // Get the template data to generate from.
    const user_package = require("../init/package.json")

    // Get the database type we specified.
    const db_type = db_module_table[answers.database.toString().toLowerCase()]

    // Add the name.
    user_package.name = answers.project_name.toString().toLowerCase()

    // Add the database dependency.
    user_package.dependencies[db_type.name] = db_type.version

    // Did the user want to seed the database?
    if (answers.seed) user_package.dependencies["multicolour-seed"] = "^0.0.6"

    const server_plugin = {
      as: "server",
      name: "multicolour-server-hapi",
      plugins: []
    }

    // Which auth plugin does the developer want? (if any)
    if (answers.authentication.length > 0) {
      if (answers.authentication.indexOf("JWT") !== 1) {
        user_package.dependencies["multicolour-hapi-jwt"] = "^0.1.4"
        server_plugin.plugins.push("multicolour-hapi-jwt")
      }
      else if (answers.authentication.length > 0) {
        user_package.dependencies["multicolour-auth-oauth"] = "^1.2.1"
        server_plugin.plugins.push("multicolour-auth-oauth")
      }
    }

    // Add the (currently) only supported server plugin.
    user_package.multicolour.plugins.push(server_plugin)

    // Add the description.
    user_package.description = answers.description || user_package.name

    // Write the package.json
    return new Promise((resolve, reject) => {
      // Serialize the data.
      const serialized = JSON.stringify(user_package, null, 2)

      // Write the file.
      fs.writeFile(`${target}/package.json`, serialized, err => {
        if (err)
          reject({
            message: "Failed to write package.json. Please paste the below into package.json manually.",
            data: JSON.stringify(user_package, null, 2)
          })
        else resolve()
      })
    })
  }

  /**
   * Write a formatted config file based on a series
   * of answers from the developer.
   * @param  {Object} answers given by the developer.
   * @return {void}
   */
  create_config_js_file(answers) {
    /* eslint-disable */
    console.info("Writing config.js")
    /* eslint-enable */

    // Get the target init directory.
    const target = this.get("init_target")

    // Get the template data to generate from.
    const user_config = require("../init/config")

    // Get the nice name -> DB name/version dictionary.
    const db_module_table = require("./db-module-table")

    // Get the database type we specified.
    const db_type = db_module_table[answers.database.toString().toLowerCase()]

    let contents = "\"use strict\""

    // Update the user configuration.
    user_config.content = "./content"

    if (answers.authentication.length > 0) {
      user_config.auth = {
        // Generate a nice, secure password to secure your users' sessions.
        password: require("crypto").createDiffieHellman(800).generateKeys("base64"),

        // You'll need to manually add your client id/secret
        // values to your config.js.
        providers: answers.authentication.map(strategy => {
          return {
            provider: strategy.toString().toLowerCase(),
            clientId: "",
            clientSecret: "",
            isSecure: false
          }
        })
      }
    }
    else {
      user_config.auth = {}
    }

    // The config that will be written to disk.
    const db_conf = {
      adapter: "development",
      host: "localhost",
      database: "multicolour"
    }

    user_config.db.connections.development = db_conf
    user_config.db.connections.production = Object.assign({}, db_conf, {adapter: "production"})

    // If a default port is set, add it to the config.
    if (db_type.port) {
      user_config.db.connections.development.port = db_type.port
      user_config.db.connections.production.port = db_type.port
    }

    // We'll do a replacement on this later so we only
    // have to open the file for writing once.
    user_config.db.adapters.development = "require({{DB}})"
    user_config.db.adapters.production = "require({{DB}})"

    // Re-order the keys, gives a better dev experience
    // with a more natural ordering.
    Object.keys(user_config).sort().forEach(key => {
      const value = user_config[key]
      delete user_config[key]
      user_config[key] = value
    })

    // Finalise the string interpolation.
    contents = `${contents}\n\nmodule.exports = ${JSON.stringify(user_config, " ", 2)}`
    contents = contents.replace(/"require\({{DB}}\)"/g, `require("${db_type.name}")`)

    // Write the package.json
    return new Promise((resolve, reject) => {
      fs.writeFile(`${target}/config.js`, contents, err => {
        if (err)
          reject({
            message: "Failed to write config.js. Please paste the below into config.js manually",
            data: user_config
          })
        else resolve()
      })
    })
  }

  /**
   * Copy the example content into place.
   * @return {void}
   */
  copy_example_content() {
    /* eslint-disable */
    console.info("Copying example content")
    /* eslint-enable */

    return new Promise((resolve, reject) => {
      fs.copy(`${__dirname}/../init/content`, `${this.get("init_target")}/content`, err => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * Once the generation has completed, this function
   * is called and it will install all the plugins
   * automatically.
   *
   * @return {Promise} unresolved promise.
   */
  install_dependencies() {
    /* eslint-disable */
    console.info("Installing your dependencies.")
    /* eslint-enable */

    const spawn = require("cross-spawn")

    const npmi = spawn("npm", ["install"], {
      cwd: this.write_path
    })

    return new Promise((resolve, reject) => {
      /* eslint-disable */
      npmi.stdout.on("data", data_buff => console.log(data_buff.toString()))
      /* eslint-enable */
      npmi.on("error", error_buff => reject(error_buff.toString()))

      npmi.on("close", resolve)
    })
  }

  run_all_tasks(answers) {
    Promise.all([
      // Write the package.json
      this.write_package_json_file(answers),

      // Write the config.js template.
      this.create_config_js_file(answers),

      // Copy the example content over.
      this.copy_example_content(),

      // Install all the dependencies in the package.json we created.
      this.install_dependencies()
    ])
    .then(() => {
      /* eslint-disable */
      console.log(chalk.blue(`
        We've generated a few files for you and copied a few things around,
        This includes a config file and a content/ folder.

        Running cd ${chalk.underline(this.write_path)} then ${chalk.underline("npm start")} or ${chalk.underline("multicolour start")} will start running your server once dependencies are installed.
        If you want to seed the database with random data, set your NODE_ENV to development.
      `))
      /* eslint-enable */
    })
    .catch(error => {
      /* eslint-disable */
      console.error("ERRORED: ", JSON.stringify(error, null, 2))
      /* eslint-enable */
    })
  }

  _deal_with_init_answers(answers) {
    // Make sure the target exists.
    mkdirp(this.get("init_target"))

    if (answers.authentication.length > 0)
      // If auth was enabled
      this.ask_for_default_user(this.get("init_target"))
        .then(this.run_all_tasks.bind(this, answers))
    else
      this.run_all_tasks(answers)
  }
}

module.exports = cli
