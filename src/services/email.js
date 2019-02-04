require('dotenv').config()
import _ from 'lodash'
import CONST from '../const'
import moment from 'moment'
import Activity from '../models/activity.model'
import Question from '../models/question.model'
const helper = require('sendgrid').mail
const from_email = new helper.Email(process.env.MAIL_FROM)
const sg = require('sendgrid')(process.env.SENDGRID_API_KEY)

const getTrandingList = function() {
  const limit = 15
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - 15) // last 15 days
  return Activity.aggregate([
    {
      $match: {
        createdAt: { $gte: fromDate },
        type: {
          $in: [
            CONST.ACTIVITY_TYPE.TAG,
            CONST.ACTIVITY_TYPE.VOTE,
            CONST.ACTIVITY_TYPE.COMMENT
          ]
        }
      }
    },
    {
      $group: { _id: '$question', count: { $sum: 1 } }
    },
    {
      $sort: {
        count: -1
      }
    },
    {
      $limit: 100 // Activity may have deleted questions. Lets filter its after
    }
  ])
    .then(result => {
      let sortedIds = _.map(result, '_id')
      return Question.find({
        _id: { $in: sortedIds }
      })
        .lean()
        .limit(limit)
        .then(questions => {
          return questions.sort((q1, q2) => {
            return (
              _.findIndex(sortedIds, id => id.equals(q1._id)) -
              _.findIndex(sortedIds, id => id.equals(q2._id))
            )
          })
        })
    })
    .then(questions => {
      const html = _.map(questions, q => {
        return `<div><a href="${process.env.SITE_URL}/q/${
          q.uri
        }" target="_blank">${q.title}</a></div>`
      })
      return Promise.resolve(html.join(''))
    })
}

const prepareCampaignHtml = function(html) {
  return Promise.resolve()
    .then(() => {
      if (html.indexOf('{{ trending_list }}') !== -1) {
        return getTrandingList().then(trendingListHtml => {
          return Promise.resolve(
            html.replace('{{ trending_list }}', trendingListHtml)
          )
        })
      } else {
        return Promise.resolve(html)
      }
    })
    .then(html => {
      return Promise.resolve(
        html +
          '<p style="font-family:Arial,Helvetica, sans-serif;font-size:12px;line-height:20px"><a class="Unsubscribe--unsubscribeLink" href="<%asm_group_unsubscribe_raw_url%>">Unsubscribe</a> - <a class="Unsubscribe--unsubscribePreferences" href="<%asm_preferences_raw_url%>">Unsubscribe Preferences</a></p>'
      )
    })
}

export default {
  sendConfirmation: (email, confirmationId, name) => {
    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: {
        from: {
          email: process.env.MAIL_FROM,
          name: process.env.MAIL_FROM_NAME
        },
        content: [
          {
            type: 'text/html',
            value:
              '<h2>Hello, {{name}}!</h2> <a href="{{siteurl}}/confirmations/{{cid}}">Click here to confirm email.</a> '
          }
        ],
        personalizations: [
          {
            substitutions: {
              '{{cid}}': confirmationId,
              '{{name}}': name,
              '{{siteurl}}': process.env.SITE_URL
            },
            to: [
              {
                email: email,
                name: name
              }
            ],
            reply_to: {
              email: process.env.MAIL_FROM,
              name: process.env.MAIL_FROM_NAME
            },
            subject: process.env.MAIL_CONFIRMATION_SUBJECT
          }
        ]
      }
    })

    return new Promise((resolve, reject) => {
      sg.API(request, function(err, resp) {
        if (err) {
          if (err.response && err.response.body && err.response.body.errors) {
            reject(err.response.body.errors)
          } else {
            reject(err)
          }
        } else {
          resolve(resp.body)
        }
      })
    })
  },

  sendFeedback: (name, email, message) => {
    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: {
        from: {
          email: process.env.MAIL_FROM,
          name: process.env.MAIL_FROM_NAME
        },
        content: [
          {
            type: 'text/html',
            value: '<h2>Feedback from {{name}} {{email}}!</h2> {{message}}'
          }
        ],
        personalizations: [
          {
            substitutions: {
              '{{name}}': name,
              '{{email}}': email,
              '{{message}}': message
            },
            to: [
              {
                email: process.env.MAIL_FEEDBACK,
                name: 'Feedbacker'
              }
            ],
            reply_to: {
              email: process.env.MAIL_FROM,
              name: process.env.MAIL_FROM_NAME
            },
            subject: process.env.MAIL_FEEDBACK_SUBJECT
          }
        ]
      }
    })

    return new Promise((resolve, reject) => {
      sg.API(request, function(err, resp) {
        if (err) {
          if (err.response && err.response.body && err.response.body.errors) {
            reject(err.response.body.errors)
          } else {
            reject(err)
          }
        } else {
          resolve(resp.body)
        }
      })
    })
  },

  createSender: data => {
    return new Promise((resolve, reject) => {
      let r = sg.emptyRequest({
        method: 'POST',
        path: '/v3/senders',
        body: data
      })
      sg.API(r, (err, resp) => {
        if (err) {
          if (err.response && err.response.body && err.response.body.errors) {
            reject(err.response.body.errors)
          } else {
            reject(err)
          }
        } else {
          resolve(resp.body)
        }
      })
    })
  },

  createList: name => {
    return new Promise((resolve, reject) => {
      let r = sg.emptyRequest({
        method: 'POST',
        path: '/v3/contactdb/lists',
        body: { name }
      })
      sg.API(r, (err, resp) => {
        if (err) {
          if (err.response && err.response.body && err.response.body.errors) {
            reject(err.response.body.errors)
          } else {
            reject(err)
          }
        } else {
          resolve(resp.body)
        }
      })
    })
  },

  createCampaign: (
    sender_id,
    list_ids,
    suppression_group_id,
    { title, subject, html_content }
  ) => {
    return new Promise((resolve, reject) => {
      prepareCampaignHtml(html_content)
        .then(html_content => {
          let r = sg.emptyRequest({
            method: 'POST',
            path: '/v3/campaigns',
            body: {
              sender_id,
              suppression_group_id,
              list_ids,
              title,
              subject,
              html_content
            }
          })
          sg.API(r, (err, resp) => {
            if (err) {
              if (
                err.response &&
                err.response.body &&
                err.response.body.errors
              ) {
                reject(err.response.body.errors)
              } else {
                reject(err)
              }
            } else {
              resolve(resp.body)
            }
          })
        })
        .catch(err => {
          reject(err)
        })
    })
  },

  sendTestCampaign: (id, to = []) => {
    return new Promise((resolve, reject) => {
      let r = sg.emptyRequest({
        method: 'POST',
        path: '/v3/campaigns/' + id + '/schedules/test',
        body: { to }
      })
      sg.API(r, (err, resp) => {
        if (err) {
          if (err.response && err.response.body && err.response.body.errors) {
            reject(err.response.body.errors)
          } else {
            reject(err)
          }
        } else {
          resolve(resp.body)
        }
      })
    })
  },

  sendCampaign: id => {
    return new Promise((resolve, reject) => {
      let r = sg.emptyRequest({
        method: 'POST',
        path: '/v3/campaigns/' + id + '/schedules/now'
      })
      sg.API(r, (err, resp) => {
        if (err) {
          if (err.response && err.response.body && err.response.body.errors) {
            reject(err.response.body.errors)
          } else {
            reject(err)
          }
        } else {
          resolve(resp.body)
        }
      })
    })
  },

  getList: id => {
    return new Promise((resolve, reject) => {
      let r = sg.emptyRequest({
        method: 'GET',
        path: '/v3/contactdb/lists/' + id
      })
      sg.API(r, (err, resp) => {
        if (err) {
          if (err.response && err.response.body && err.response.body.errors) {
            reject(err.response.body.errors)
          } else {
            reject(err)
          }
        } else {
          resolve(resp.body)
        }
      })
    })
  },

  addRecepient: email => {
    return new Promise((resolve, reject) => {
      const r = sg.emptyRequest({
        method: 'POST',
        path: '/v3/contactdb/recipients',
        body: [{ email }]
      })
      sg.API(r, (err, resp) => {
        if (err) {
          if (err.response && err.response.body && err.response.body.errors) {
            reject(err.response.body.errors)
          } else {
            reject(err)
          }
        } else {
          resolve(resp.body.persisted_recipients[0])
        }
      })
    })
  },

  addRecepientToList: (recepId, listId) => {
    return new Promise((resolve, reject) => {
      const r = sg.emptyRequest({
        method: 'POST',
        path: `/v3/contactdb/lists/${listId}/recipients/${recepId}`
      })
      sg.API(r, (err, resp) => {
        if (err) {
          if (err.response && err.response.body && err.response.body.errors) {
            reject(err.response.body.errors)
          } else {
            reject(err)
          }
        } else {
          resolve()
        }
      })
    })
  }
}
