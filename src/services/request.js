const debug = require("debug")("request")

const requestMiddleware = (req, res, next) => {
  let params = {}
  if (req.params) {
    params = Object.assign(params, req.params)
  }
  if (req.body) {
    params = Object.assign(params, req.body)
  }

  /***/ debug("params %o", params)

  next()
}

export default requestMiddleware
