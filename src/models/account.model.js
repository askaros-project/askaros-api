const log = require('../services/log')('account.model')
import _ from 'lodash'
import CONST from '../const'
import mongoose from 'mongoose'
import mongoose_delete from 'mongoose-delete'
import pbkdf2 from '../services/pbkdf2'
import validation from '../services/validation'
import emailSender from '../services/email'
import jwt from 'jwt-simple'
import { OAuth2Client } from 'google-auth-library'
import User from './user.model'
import Confirmation from './confirmation.model'
import MailList from './mail_list.model'

mongoose.Promise = require('bluebird')

const Schema = mongoose.Schema

const accountSchema = new Schema(
  {
    isAdmin: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    provider: {
      type: String,
      enum: [
        CONST.ACCOUNT_PROVIDER.EMAIL,
        CONST.ACCOUNT_PROVIDER.FACEBOOK,
        CONST.ACCOUNT_PROVIDER.GOOGLE,
        CONST.ACCOUNT_PROVIDER.TWITTER
      ],
      required: true
    },
    credentials: { type: Object, required: true, select: false },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
    'credentials.email': data.email
  })
    .select('+credentials')
    .then(existingAccount => {
      if (existingAccount) {
        if (existingAccount.credentials.confirmed) {
          return Promise.reject(CONST.ERROR.EMAIL_ALREADY_IN_USE)
        } else {
          existingAccount.remove()
        }
      }
      return validation
        .validate(data, {
          username: {
            type: 'string',
            required: true,
            allowEmpty: false,
            trim: true
          },
          email: {
            type: 'string',
            required: true,
            allowEmpty: false,
            trim: true,
            format: 'email'
          },
          password: {
            type: 'string',
            required: true,
            allowEmpty: false,
            trim: true,
            minLength: 4
          }
        })
        .then(() => {
          const user = new User({ username: data.username })
          return Promise.all([user.save(), pbkdf2.hashPassword(data.password)])
        })
        .then(([user, hash]) => {
          const account = new ModelClass({
            provider: CONST.ACCOUNT_PROVIDER.EMAIL,
            credentials: {
              email: data.email,
              password: hash,
              confirmed: false
            },
            user: user
          })
          return account.save()
        })
        .then(account => {
          addMailRecepient(data.email)
          sendConfirmation(account, data.email, data.username)
          return account
        })
    })
}

accountSchema.statics.loginByEmail = ({ email, password }) => {
  if (!email || !password) {
    return Promise.reject(CONST.ERROR.WRONG_LOGIN_OR_PASSWORD)
  }

  return ModelClass.findOne({
    provider: CONST.ACCOUNT_PROVIDER.EMAIL,
    'credentials.email': email
  })
    .select('+credentials')
    .then(account => {
      if (!account) {
        return Promise.reject(CONST.ERROR.ACCOUNT_NOT_FOUND)
      }
      return ModelClass.comparePassword(
        password,
        account.credentials.password
      ).then(isValid => {
        if (isValid) {
          return issueToken(account)
        } else {
          return Promise.reject(CONST.ERROR.WRONG_LOGIN_OR_PASSWORD)
        }
      })
    })
}

accountSchema.statics.loginByFacebook = (fbUserId, { name, email }) => {
  if (!fbUserId || !name) {
    return Promise.reject(CONST.ERROR.WRONG_REQUEST)
  }
  return ModelClass.findOne({
    provider: CONST.ACCOUNT_PROVIDER.FACEBOOK,
    'credentials.fbUserId': fbUserId
  })
    .then(account => {
      if (!account) {
        return new User({
          username: name
        })
          .save()
          .then(user => {
            account = new ModelClass({
              provider: CONST.ACCOUNT_PROVIDER.FACEBOOK,
              credentials: {
                fbUserId
              },
              user: user
            })
            return account.save()
          })
          .then(account => {
            if (email) {
              addMailRecepient(email)
            }
            return account
          })
      }
      return account
    })
    .then(account => {
      return issueToken(account)
    })
    .catch(err => {
      return Promise.reject(err)
    })
}

accountSchema.statics.loginByGoogle = ({ code }) => {
  if (!code) {
    return Promise.reject(CONST.ERROR.WRONG_REQUEST)
  }

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage'
  )

  return oauth2Client
    .getToken(code)
    .then(resp => {
      if (resp && resp.tokens && resp.tokens.access_token) {
        return resp.tokens
      } else {
        return Promise.reject('Cannot get access token', resp)
      }
    })
    .then(tokens => {
      return oauth2Client
        .verifyIdToken({
          idToken: tokens.id_token,
          audience: process.env.GOOGLE_CLIENT_ID
        })
        .then(vtoken => vtoken.getPayload())
    })
    .then(data => {
      return ModelClass.findOne({
        provider: CONST.ACCOUNT_PROVIDER.GOOGLE,
        credentials: { gUserId: data.sub }
      }).then(account => {
        if (!account) {
          const user = new User({
            username: data.name
          })
          return user.save().then(user => {
            const account = new ModelClass({
              provider: CONST.ACCOUNT_PROVIDER.GOOGLE,
              credentials: {
                gUserId: data.sub
              },
              user: user
            })
            return account.save().then(account => {
              if (data.email) {
                addMailRecepient(data.email)
              }
              return account
            })
          })
        }
        return account
      })
    })
    .then(account => {
      return issueToken(account)
    })
}

accountSchema.statics.loginByTwitter = ({ twUserId, username, email }) => {
  return ModelClass.findOne({
    provider: CONST.ACCOUNT_PROVIDER.TWITTER,
    'credentials.twUserId': twUserId
  })
    .then(account => {
      if (!account) {
        return new User({
          username: username
        })
          .save()
          .then(user => {
            account = new ModelClass({
              provider: CONST.ACCOUNT_PROVIDER.TWITTER,
              credentials: {
                twUserId
              },
              user: user
            })
            return account.save().then(account => {
              if (email) {
                addMailRecepient(email)
              }
              return account
            })
          })
      }
      return account
    })
    .then(account => {
      return issueToken(account)
    })
}

accountSchema.statics.comparePassword = (candidatePassword, passwordHash) => {
  return pbkdf2.verifyPassword(candidatePassword, passwordHash)
}

accountSchema.post('remove', function(doc) {
  User.findById(doc.user).then(user => {
    if (user) {
      user.remove()
    }
  })
  Confirmation.deleteMany({ account: doc._id })
})

function sendConfirmation(account, email, username) {
  let confirmation = new Confirmation({
    account: account._id,
    email: email
  })
  return confirmation.save().then(conf => {
    return emailSender.sendConfirmation(email, conf._id, username)
  })
}

function addMailRecepient(email) {
  return emailSender.addRecepient(email).then(recepId => {
    return MailList.findOne({ type: CONST.MAIL_LIST.USERS })
      .lean()
      .then(maillist => {
        if (!maillist) {
          return Promise.reject('MailList for users not found!')
        }
        return emailSender.addRecepientToList(recepId, maillist.sendgridId)
      })
  })
}

function issueToken(account) {
  let now = new Date().getTime()
  let payload = {
    _id: account._id,
    expire: now + process.env.JWT_VALID_DAYS * 24 * 60 * 60 * 1000
  }
  let token = jwt.encode(payload, process.env.JWT_SECRET)
  return token
}

accountSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: true
})
const ModelClass = mongoose.model('Account', accountSchema)
export default ModelClass
