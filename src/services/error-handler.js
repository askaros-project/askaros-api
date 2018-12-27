import CONST from "../const"
import _ from "lodash"
const errors = Object.keys(CONST.ERROR)

export default log => {
  return (res, status) => {
    status = status || 400
    return err => {
      log.crit(err)

      if (err instanceof Error) {
        err = JSON.stringify(err, ["message", "details"])
      }

      if (_.indexOf(errors, err) > 0) {
        return res
          .status(status)
          .json({ status: false, error: { message: err } })
      } else if (typeof err == "object" && _.indexOf(errors, err.message) > 0) {
        return res.status(status).json({ status: false, error: err })
      } else {
        // TODO prevent error details in production
        return res.status(status).json({
          status: false,
          error: { message: CONST.ERROR.UNKNOWN_ERROR, details: err }
        })
      }
    }
  }
}
