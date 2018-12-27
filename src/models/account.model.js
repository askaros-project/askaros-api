const log = require("../services/log")("account.model")
import _ from "lodash"
import CONST from "../const"
import mongoose from "mongoose"
import mongoose_delete from "mongoose-delete"
import pbkdf2 from "../services/pbkdf2"
import validation from "../services/validation"
import config from "../config"
import jwt from "jwt-simple"
import User from "./user.model"

mongoose.Promise = require("bluebird")

const Schema = mongoose.Schema

const accountSchema = new Schema(
  {
    isAdmin: { type: Boolean, default: false },
    provider: {
      type: String,
      enum: [CONST.ACCOUNT_PROVIDER.EMAIL],
      required: true
    },
    credentials: { type: Object, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { usePushEach: true }
)

accountSchema.statics.createByEmail = data => {
  if (!data.email || !data.password || !data.username) {
    return Promise.reject(CONST.ERROR.WRONG_REQUEST)
  }
  return ModelClass.findOne({
    provider: CONST.ACCOUNT_PROVIDER.EMAIL,
    "credentials.email": data.email
  }).then(existingUser => {
    if (existingUser) {
      return Promise.reject(CONST.ERROR.EMAIL_ALREADY_IN_USE)
    }
    return validation
      .validate(data, {
        username: {
          type: "string",
          required: true,
          allowEmpty: false,
          trim: true
        },
        email: {
          type: "string",
          required: true,
          allowEmpty: false,
          trim: true,
          format: "email"
        },
        password: {
          type: "string",
          required: true,
          allowEmpty: false,
          trim: true,
          minLength: 4
        }
      })
      .then(() => {
        let user = new User({
          username: data.username
        })
        return Promise.all([user.save(), pbkdf2.hashPassword(data.password)])
      })
      .then(([user, hash]) => {
        const account = new ModelClass({
          provider: CONST.ACCOUNT_PROVIDER.EMAIL,
          credentials: {
            email: data.email,
            password: hash
          },
          user: user
        })
        return account.save()
      })
      .then(account => {
        return account
      })
  })
}

accountSchema.statics.loginByEmail = ({ email, password }) => {
  if (!email || !password) {
    return Promise.reject(CONST.ERROR.CONST.ERROR.WRONG_LOGIN_OR_PASSWORD)
  }

  return ModelClass.findOne({
    provider: CONST.ACCOUNT_PROVIDER.EMAIL,
    "credentials.email": email
  }).then(account => {
    if (!account) {
      return Promise.reject(CONST.ERROR.ACCOUNT_NOT_FOUND)
    }
    return ModelClass.comparePassword(
      password,
      account.credentials.password
    ).then(isValid => {
      if (isValid) {
        let now = new Date().getTime()
        let payload = {
          _id: account._id,
          expire: now + config.SECURITY.VALID_DAYS * 24 * 60 * 60 * 1000
        }
        let token = jwt.encode(payload, config.SECURITY.JWT_SECRET)
        return token
      } else {
        return Promise.reject(CONST.ERROR.WRONG_LOGIN_OR_PASSWORD)
      }
    })
  })
}

// accountSchema.methods.setPassword = function(password) {
//   const model = this
//
//   return validation
//     .validate(
//       { password },
//       {
//         password: {
//           type: "string",
//           required: true,
//           allowEmpty: false,
//           trim: true,
//           minLength: 5
//         }
//       }
//     )
//     .then(() => {
//       return pbkdf2.hashPassword(password).then(hash => {
//         _.assign(model, { passwordOrToken: hash })
//         return model.save()
//       })
//     })
// }

accountSchema.statics.comparePassword = (candidatePassword, passwordHash) => {
  return pbkdf2.verifyPassword(candidatePassword, passwordHash)
}

accountSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: true
})
const ModelClass = mongoose.model("Account", accountSchema)
export default ModelClass
