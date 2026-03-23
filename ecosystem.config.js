module.exports = {
  apps : [{
    name   : "pedreiro web",
    script : "./server.ts",
    watch: false,
    interpreter: "node",
    env_production: {
       NODE_ENV: "production"
    },
    env_development: {
       NODE_ENV: "development"
    }
  }]
};
