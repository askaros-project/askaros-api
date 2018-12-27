const log = require("./log")("passport")

import passport from "passport"
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt"
import LocalStrategy from "passport-local"
import config from "../config"
import * as _ from "lodash"
import Account from "../models/account.model"

// Setup options for JWT strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  secretOrKey: config.SECURITY.JWT_SECRET
}

// Create JWT strategy
// payload: decoded jwt token
// done: callback function
const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
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

// Tell passport to use strategy
passport.use(jwtLogin)
