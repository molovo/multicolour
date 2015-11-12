module.exports = Object.freeze({
  // Generators.
  SERVER_GENERATOR: 1,
  FRONTEND_GENERATOR: 2,
  DATABASE_GENERATOR: 5,

  // Other states and services.
  SERVER_BOOTUP: 3,
  SERVER_SHUTDOWN: 4,

  // Plugins.
  AUTH_PLUGIN: 6,
  STORAGE_PLUGIN: 7,

  SERVER_TRANSFORMER: 8
})
