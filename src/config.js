import env from "node-env-file"
import path from "path"
import fs from "fs"

const envPath = path.resolve(__dirname, "../.env")
if (fs.existsSync(envPath)) {
  env(envPath)
}

let config = {
  PORT: process.env.PORT || 4321,
  SECURITY: {
    VALID_DAYS: 30,
    JWT_SECRET: "onoicighgapdk30-mdf92cjvowtn6329gjrnwcm44DW3f#"
  }
}

export default config
