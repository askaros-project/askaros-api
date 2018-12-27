import _ from "lodash"
import moment from "moment"
const helper = require("sendgrid").mail
import config from "../config"
const from_email = new helper.Email(config.MAIL.FROM)
const sg = require("sendgrid")(config.MAIL.SENDGRID_API_KEY)
import CONST from "../const"

export default {
  sendConfirmation: (email, confirmationId, name) => {
    const request = sg.emptyRequest({
      method: "POST",
      path: "/v3/mail/send",
      body: {
        from: {
          email: config.MAIL.FROM,
          name: "Strut Bot"
        },
        content: [
          {
            type: "text/html",
            value:
              '<h2>Hello, {{name}}!</h2> <a href="{{siteurl}}/confirmations/{{cid}}">Click here to confirm email.</a> '
          }
        ],
        personalizations: [
          {
            substitutions: {
              "{{cid}}": confirmationId,
              "{{name}}": name,
              "{{siteurl}}": config.SITE_URL
            },
            to: [
              {
                email: email,
                name: name
              }
            ],
            reply_to: {
              email: config.MAIL.FROM,
              name: "Strut Bot"
            },
            subject: config.MAIL.CONFIRMATION_SUBJECT
          }
        ]
      }
    })

    sg.API(request, function(error, response) {
      //
    })
  },

  sendPasswordRecovery: (user, key) => {
    console.log(user, key)
    const request = sg.emptyRequest({
      method: "POST",
      path: "/v3/mail/send",
      body: {
        from: {
          email: config.MAIL.FROM,
          name: "Strut Bot"
        },
        content: [
          {
            type: "text/html",
            value:
              '<h2>Hello, {{name}}!</h2> <a clicktracking=off href="{{siteurl}}/password-recovery/{{key}}">Click here to reset your password.</a>'
          }
        ],
        personalizations: [
          {
            substitutions: {
              "{{key}}": key,
              "{{name}}": user.username,
              "{{siteurl}}": config.SITE_URL
            },
            to: [
              {
                email: user.login,
                name: user.username
              }
            ],
            reply_to: {
              email: config.MAIL.FROM,
              name: "Strut Bot"
            },
            subject: config.MAIL.PASSWORD_RECOVERY_SUBJECT
          }
        ]
      }
    })

    sg.API(request, function(error, response) {
      //
    })
  }
}
