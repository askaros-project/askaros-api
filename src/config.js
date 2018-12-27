import env from "node-env-file"
import path from "path"
import fs from "fs"

const envPath = path.resolve(__dirname, "../.env")
if (fs.existsSync(envPath)) {
  env(envPath)
}

// let SITE_URL = process.env.SITE_URL
// if (!SITE_URL) {
//   if (process.env.NODE_ENV === "stage") {
//     SITE_URL = "http://178.62.21.7:4321"
//   } else if (process.env.NODE_ENV === "production") {
//     SITE_URL = "http://52.91.66.180"
//   } else {
//     SITE_URL = "http://localhost:3000"
//   }
// }

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
  },
  MAIL: {
    FROM: "bot@qapp.io",
    BODY: ""
  }
}

export default config
