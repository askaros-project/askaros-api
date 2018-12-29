import _ from "lodash"
import moment from "moment"
const helper = require("sendgrid").mail
import config from "../config"
const from_email = new helper.Email(process.env.MAIL_FROM)
const sg = require("sendgrid")(process.env.MAIL_SENDGRID_API_KEY)

export default {
  sendConfirmation: (email, confirmationId, name) => {
    const request = sg.emptyRequest({
      method: "POST",
      path: "/v3/mail/send",
      body: {
        from: {
          email: process.env.MAIL_FROM,
          name: "QApp Bot"
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
              "{{siteurl}}": process.env.SITE_URL
            },
            to: [
              {
                email: email,
                name: name
              }
            ],
            reply_to: {
              email: process.env.MAIL_FROM,
              name: "QApp Bot"
            },
            subject: process.env.MAIL_CONFIRMATION_SUBJECT
          }
        ]
      }
    })

    sg.API(request, function(error, response) {
      //
    })
  }
}
