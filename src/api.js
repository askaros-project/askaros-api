import { Router } from "express"
import passport from "passport"
import { jwtLogin } from "./services/passport"
import request from "./services/request"
import response from "./services/response"
import accountRoute from "./api/account.route"
import userRoute from "./api/user.route"
import questionRoute from "./api/question.route"
import adminRoute from "./api/admin.route"

passport.use(jwtLogin)
const requireAuth = passport.authenticate("jwt", {
  session: false,
  assignProperty: "account"
})
const requireAdmin = (req, res, next) => {
  if (!req.account.isAdmin) {
    return res.sendError("Forbidden", 403)
  }
  next()
}

export function API() {
  const api = Router()

  api.use(request)
  api.use(response)

  // ACCOUNT
  api.get("/account", requireAuth, accountRoute.getData)
  api.post("/account/email", accountRoute.emailReg)
  api.post("/account/email/login", accountRoute.emailLogin)
  api.post("/account/email/confirmation/:id", accountRoute.emailConfirmation)
  api.post("/account/facebook/login", accountRoute.facebookLogin)
  api.post("/account/google/login", accountRoute.googleLogin)
  api.post("/account/twitter/login", accountRoute.twitterLogin)

  // USER

  // QUESTIONS
  api.post("/questions", requireAuth, questionRoute.create)

  // ADMIN
  api.get("/admin/accounts", requireAuth, requireAdmin, adminRoute.getAccounts)

  return api
}
