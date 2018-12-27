const log = require("../services/log")("account.route")
import Account from "../models/account.model"
import CONST from "../const"
import _ from "lodash"

const AccountRoute = {
  emailReg: (req, res) => {
    Account.createByEmail(req.body)
      .then(() => {
        /***/ log.info("Account have been successfully created")
        return res.sendSuccess()
      })
      .catch(err => {
        return res.sendError(err)
      })
  },

  emailLogin: (req, res) => {
    Account.loginByEmail(req.body)
      .then(token => {
        /***/ log.info("Account have been successfully logged in")
        return res.sendSuccess({ token })
      })
      .catch(err => {
        return res.sendError(err)
      })
  },

  facebookLogin: (req, res) => {
    Account.loginByFacebook(req.body)
      .then(token => {
        /***/ log.info("Account have been successfully logged in")
        return res.sendSuccess({ token })
      })
      .catch(err => {
        return res.sendError(err)
      })
  },

  googleLogin: (req, res) => {
    Account.loginByGoogle(req.body)
      .then(token => {
        /***/ log.info("Account have been successfully logged in")
        return res.sendSuccess({ token })
      })
      .catch(err => {
        return res.sendError(err)
      })
  }
}

export default AccountRoute
