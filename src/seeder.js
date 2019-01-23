require('dotenv').config()
const log = require('./services/log')('seeder')
import _ from 'lodash'
import fetch from 'node-fetch'
import Promise from 'bluebird'
import pbkdf2 from './services/pbkdf2'
import CONST from './const'
import Account from './models/account.model'
import User from './models/user.model'
import MailList from './models/mail_list.model'
import MailSender from './models/mail_sender.model'
import email from './services/email'

function seedAccounts() {
  const data = [
    {
      username: 'John Smith',
      email: 'admin@askaros.com',
      password: 'admin123',
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

function seedMailList() {
  return MailList.findOne({ type: CONST.MAIL_LIST.SUBSCRIBERS })
    .then(list => {
      if (!list) {
        return email.createList('Subscribers').then(list => {
          return new MailList({
            type: CONST.MAIL_LIST.SUBSCRIBERS,
            sendgridId: list.id
          }).save()
        })
      } else {
        return Promise.resolve()
      }
    })
    .then(() => {
      return MailList.findOne({ type: CONST.MAIL_LIST.USERS }).then(list => {
        if (!list) {
          return email.createList('Users').then(list => {
            return new MailList({
              type: CONST.MAIL_LIST.USERS,
              sendgridId: list.id
            }).save()
          })
        } else {
          return Promise.resolve()
        }
      })
    })
}

function seedMailSender() {
  return MailSender.findOne({})
    .lean()
    .then(sender => {
      if (!sender) {
        return email
          .createSender({
            nickname: 'Sender',
            from: {
              email: process.env.MAIL_FROM,
              name: process.env.MAIL_FROM_NAME
            },
            reply_to: {
              email: process.env.MAIL_REPLY_TO,
              name: process.env.MAIL_REPLY_TO_NAME
            },
            address: process.env.MAIL_SENDER_ADDRESS,
            city: process.env.MAIL_SENDER_CITY,
            country: process.env.MAIL_SENDER_COUNTRY
          })
          .then(sender => {
            return new MailSender({
              sendgridId: sender.id
            }).save()
          })
          .then(() => {
            return Promise.resolve()
          })
      } else {
        return Promise.resolve()
      }
    })
}

function seedAll() {
  log.info('Seeding...')
  return Promise.resolve()
    .then(() => {
      log.info('Seeding accounts..')
      return seedAccounts()
    })
    .then(() => {
      log.info('Seeding mail sender..')
      return seedMailSender()
    })
    .then(() => {
      log.info('Seeding mail list..')
      return seedMailList()
    })
    .then(() => {
      log.info('Seeding finished')
    })
    .catch(err => {
      log.crit(err)
    })
}

export default {
  seedAll: seedAll
}
