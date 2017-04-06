"use strict"

// Get tools.
const fs = require("fs-extra")
const path = require("path")
const chalk = require("chalk")
const mkdirp = require("mkdirp")
const inquirer = require("inquirer")
const db_module_table = require("../../db-module-table")

class CLI_Init {

  constructor(CLI) {
    this.CLI = CLI
  }

  program() {
    // Set up the init command.
    this.CLI.program
      .command("init [target]")
      .alias("I")
      .description("Create a new Multicolour project in the target/current directory and start the wizard.")
      .option("-t, --target <dir>", "Where to init.", "./")
      .action(this.run.bind(this))
  }

  /**
   * Do the init, ask a heap of questions
   * then create, copy and write all the files
   * and configs to where they need to be.
   *
   * @param  {String} init_path to create project at.
   * @return {Promise} promise in resolved state.
   */
  run(init_path) {
    // Default the init path to the current CWD.
    if (!init_path)
      init_path = "."

    /**
     * Where are we going to create this
     * new project? An absolute path to the
     * answer to the original init prompt.
     *
     * @type {String}
     */
    this.target = path.resolve(init_path)

    // We need to validate the package name for npm.
    const valid_name = require("validate-npm-package-name")

    // Ask the questions and return a promise.
    return inquirer.prompt([
      {
        default: "n",
        type: "input",
        name: "confirmed",
        message: `Creating a project in "${this.target}" will overwrite any existing project, are you sure?`,
        // Validate that they agreed.
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
        default: path.basename(this.target.replace(/\s+/, "-")).toLowerCase(),
        // Validate the package name.
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
        type: "input",
        name: "database_host",
        message: "Enter your database host:",
        default: "0.0.0.0"
      },
      {
        type: "input",
        name: "database_username",
        message: "Enter your database username:",
        default: "root"
      },
      {
        type: "password",
        name: "database_password",
        message: "Enter your database password:",
        default: ""
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
    ])
    .then(this.deal_with_init_answers.bind(this))
  }

  /**
   * Take the answers to the questions above
   * and do all the work.
   *
   * @param  {Array<mixed>} answers from the CLI.
   * @return {Promise} promise in resolved state.
   */
  deal_with_init_answers(answers) {
    // Make sure the target exists.
    mkdirp(this.target)

    if (answers.authentication.length > 0)
      // If auth was enabled
      return Promise.all([
        this.ask_for_default_user(this.target),
        // this.ask_for_any_auth_config(),
        this.run_all_tasks.bind(this, answers)
      ])
    else
      return this.run_all_tasks(answers)
  }

  /**
   * Ask for a username and password for
   * the initial user.
   *
   * @param  {String} target folder of the init.
   * @return {Promise} promise in resolved state.
   */
  ask_for_default_user() {
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
            .replace("const role = \"user\"", "const role = \"admin\"")

        mkdirp(`${this.target}/content/plugins/`, err => {
          if (err) throw err
          /* eslint-disable */
          fs.writeFile(`${this.target}/content/plugins/default-user.js`, file, err => {
            if (err) throw err
          })
          /* eslint-enable */
        })
      })
    })
  }

  /**
   * Run all the tasks required to initialise an app.
   *
   * @param  {Array<mixed>} answers from the CLI.
   * @return {Promise} promise in resolved state.
   */
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

        Running cd ${chalk.underline(this.target)} then ${chalk.underline("npm start")} or ${chalk.underline("multicolour start")} will start running your server once dependencies are installed.
        If you want to seed the database with random data, set your NODE_ENV to development.
      `))
      /* eslint-enable */
    })
    .catch(error => {
      /* eslint-disable */
      console.error("ERRORED: ", error)
      /* eslint-enable */
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
    console.info("Installing your API's dependencies- Not any databases.")
    /* eslint-enable */

    const spawn = require("cross-spawn")

    const npmi = spawn("npm", ["install"], {
      cwd: this.target
    })

    return new Promise((resolve, reject) => {
      /* eslint-disable */
      npmi.stdout.on("data", data_buff => console.log(data_buff.toString()))
      /* eslint-enable */
      npmi.on("error", error_buff => reject(error_buff.toString()))

      npmi.on("close", resolve)
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
    const target = this.target

    // Get the template data to generate from.
    const user_config = require("../init/config")

    // Get the database type we specified.
    const db_type = db_module_table[answers.database.toString().toLowerCase()]

    let contents = "\"use strict\""

    // Update the user configuration.
    user_config.content = "./content"

    if (answers.authentication.length > 0) {
      inquirer.prompt(answers.authentication.reduce((questions, provider) => {
        questions.push({
          type: "input",
          name: provider + "_id",
          message: `Enter the client ID for ${provider}`
        })

        questions.push({
          type: "input",
          name: provider + "_secret",
          message: `Enter the client secret for ${provider}`
        })

        return questions
      }, []))
        .then(answers => {
          console.log(answers)

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
        })
    }
    else {
      user_config.auth = {}
    }

    // The config that will be written to disk.
    const db_conf = {
      adapter: "development",
      host: "localhost",
      database: answers.project_name
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
      fs.copy(__dirname + "/../init/content", `${this.target}/content`, err => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * Write a formatted JSON file based on a series
   * of answers from the developer.
   *
   * @param  {Object} answers given by the developer.
   * @return {void}
   */
  write_package_json_file(answers) {
    /* eslint-disable */
    console.info("Writing package.json")
    /* eslint-enable */

    // Get the target init directory.
    const target = this.target

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
      if (answers.authentication.indexOf("JWT") > 0) {
        user_package.dependencies["multicolour-hapi-jwt"] = "^0.1.4"
        server_plugin.plugins.push("multicolour-hapi-jwt")
      }
      else if (answers.authentication.length > 0) {
        user_package.dependencies["multicolour-auth-oauth"] = "^1.2.1"
        server_plugin.plugins.push("multicolour-auth-oauth")
      }

      user_package.multicolour.plugins.push("/content/plugins/default-user")
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
}

module.exports = CLI_Init
