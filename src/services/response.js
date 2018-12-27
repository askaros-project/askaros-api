import CONST from "../const"
import _ from "lodash"
const errors = Object.keys(CONST.ERROR)

const errorResp = log => {
  return (res, status) => {
    status = status || 500
    return err => {
      log.crit(err)

      if (err instanceof Error) {
        err = JSON.stringify(err, ["message", "details"])
      }

      if (_.indexOf(errors, err) !== -1) {
        return res
          .status(status)
          .json({ success: false, error: { message: err } })
      } else if (
        typeof err == "object" &&
        _.indexOf(errors, err.message) !== -1
      ) {
        return res.status(status).json({ success: false, error: err })
      } else {
        return res
          .status(status)
          .json({
            success: false,
            error: { message: CONST.ERROR.UNKNOWN_ERROR, details: err }
          })
      }
    }
  }
}

const successResp = log => {
  return (res, status) => {
    status = status || 200
    return (data = {}) => {
      return res.status(status).json(_.assign({ success: true }, data))
    }
  }
}

export default {
  errorResp,
  successResp
}
