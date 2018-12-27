module.exports = {
  apps : [{
    name        : "rat-server-prod",
    script      : "./dist/index.js",
    watch       : false,
    env: {
      "NODE_ENV": "production",
      "PORT": 4401
    }
  }]
}