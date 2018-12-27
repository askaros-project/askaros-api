const log = require("./services/log")("seeder")
import _ from "lodash"
import fetch from "node-fetch"
import Promise from "bluebird"
import pbkdf2 from "./services/pbkdf2"

import User from "./models/user.model"

function seedUsers() {
  const data = [
    {
      username: "John Smith",
      provider: "email",
      email: "admin@qapp.io",
      login: "admin@qapp.io",
      password: "admin123",
      isAdmin: true
    }
  ]
  return Promise.resolve()
    .then(() => {
      return User.find({})
    })
    .then(users => {
      if (users.length) {
        return Promise.resolve()
      }
      return Promise.all(
        _.map(data, d => {
          return pbkdf2.hashPassword(d.password).then(hash => {
            d.passwordOrToken = hash
            const user = new User(d)
            return user.save()
          })
        })
      )
    })
}

function seedAll() {
  log.info("Seeding...")
  return Promise.resolve()
    .then(() => {
      log.info("Seeding users..")
      return seedUsers()
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
