const log = require("./services/log")("api")

import _ from "lodash"
import path from "path"
import config from "./config"
import passport from "passport"
import { Router } from "express"
import CONST from "./const"
import response from "./services/response"
import express from "express"
import Promise from "bluebird"
import Account from "./models/account.model"
import User from "./models/user.model"
const successResp = response.successResp(log)
const errorResp = response.errorResp(log)

require("./services/passport")
const requireAuth = passport.authenticate("jwt", {
  session: false,
  assignProperty: "account"
})

import accountRoute from "./api/account.route"
import userRoute from "./api/user.route"

export function API() {
  const api = Router()

  api.use(function(req, res, next) {
    res.sendSuccess = (data, status) => {
      return successResp(res, status)(data)
    }
    res.sendError = (err, status) => {
      return errorResp(res, status)(err)
    }
    next()
  })

  // ACCOUNT
  api.post("/account/email", accountRoute.emailReg)
  api.post("/account/email/login", accountRoute.emailLogin)
  api.post("/account/facebook/login", accountRoute.facebookLogin)
  api.post("/account/google/login", accountRoute.googleLogin)

  // USER
  api.get("/user", requireAuth, userRoute.getData)

  return api
}
