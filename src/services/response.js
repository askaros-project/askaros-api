import CONST from "../const"
import _ from "lodash"
const debug = require("debug")("response")
const errors = Object.keys(CONST.ERROR)

const errorResp = (res, status) => {
  status = status || 500
  return err => {
    /***/ debug("Error %o", err)
    if (typeof err === "string" && _.indexOf(errors, err) !== -1) {
      return res.status(status).json({ success: false, error: { type: err } })
    } else if (typeof err === "object" && _.indexOf(errors, err.type) !== -1) {
      return res.status(status).json({ success: false, error: err })
    } else {
      return res.status(status).json({
        success: false,
        error: { type: CONST.ERROR.INTERNAL_ERROR }
      })
    }
  }
}

const successResp = (res, status) => {
  status = status || 200
  return (data = {}) => {
    /***/ debug("Success %o", data)
    return res.status(status).json(_.assign({ success: true }, data))
  }
}

const responseMiddleware = (req, res, next) => {
  res.sendSuccess = (data, status) => {
    return successResp(res, status)(data)
  }
  res.sendError = (err, status) => {
    return errorResp(res, status)(err)
  }
  next()
}

export default responseMiddleware
