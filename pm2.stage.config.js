module.exports = {
  apps : [{
    name        : "rat-server-stage",
    script      : "./dist/index.js",
    watch       : false,
    env: {
      "NODE_ENV": "stage",
      "PORT": 4401
    }
  }]
}