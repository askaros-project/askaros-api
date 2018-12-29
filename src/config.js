import env from "node-env-file"
import path from "path"
import fs from "fs"

const envPath = path.resolve(__dirname, "../.env")
if (fs.existsSync(envPath)) {
  env(envPath)
}

let noDev = process.env.NODE_ENV === "production"
let config = {
  //  SITE_URL: SITE_URL,
  CORS_ORIGIN: [
    /*.dev */
    /.*localhost.*/,
    /* stage */
    /.*178\.62\.21\.7\:4400.*/,
    /.*178\.62\.21\.7\:4402.*/
  ],
  API_PREFIX: "/api/v1",
  MONGO: {
    URI: "mongodb://127.0.0.1/qapp",
    DEBUG: true
  },
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  PORT: process.env.PORT || 4321,
  SECURITY: {
    VALID_DAYS: 30,
    JWT_SECRET: "onoicighgapdk30-mdf92cjvowtn6329gjrnwcm44DW3f#"
  }
}

export default config
