const log = require("./services/log")("seeder")
import _ from "lodash"
import fetch from "node-fetch"
import Promise from "bluebird"
import pbkdf2 from "./services/pbkdf2"
import CONST from "./const"
import Account from "./models/account.model"
import User from "./models/user.model"

function seedAccounts() {
  const data = [
    {
      username: "John Smith",
      email: "admin@qapp.io",
      password: "admin123",
      isAdmin: true
    }
  ]
  return Promise.resolve()
    .then(() => {
      return Account.find({})
    })
    .then(accounts => {
      if (accounts.length) {
        return Promise.resolve()
      }
      return Promise.all(
        _.map(data, d => {
          let user = new User({
            username: d.username,
            email: d.email
          })
          return Promise.all([
            user.save(),
            pbkdf2.hashPassword(d.password)
          ]).then(([user, hash]) => {
            let account = new Account({
              provider: CONST.ACCOUNT_PROVIDER.EMAIL,
              credentials: {
                email: d.email,
                confirmed: true,
                password: hash
              },
              user: user,
              isAdmin: d.isAdmin
            })
            return account.save()
          })
        })
      )
    })
}

function seedAll() {
  log.info("Seeding...")
  return Promise.resolve()
    .then(() => {
      log.info("Seeding accounts..")
      return seedAccounts()
    })
    .then(() => {
      log.info("Seeding finished")
    })
    .catch(err => {
      log.crit(err)
    })
}

export default {
  seedAll: seedAll
}
