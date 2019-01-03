import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt"
import Account from "../models/account.model"

require("dotenv").config()

// Setup options for JWT strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  secretOrKey: process.env.JWT_SECRET
}

// Create JWT strategy
// payload: decoded jwt token
// done: callback function
export const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
  Account.findById(payload._id)
    .select("_id provider user isAdmin createdAt")
    .lean()
    .then(account => {
      let now = new Date().getTime()
      let expireDate = new Date(payload.expire).getTime()
      if (!account || expireDate < now) {
        done(null, false)
      } else {
        done(null, account)
      }
    })
    .catch(err => {
      done(err, false)
    })
})
