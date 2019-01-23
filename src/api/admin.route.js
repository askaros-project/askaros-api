const log = require('../services/log')('user.route')
import CONST from '../const'
import _ from 'lodash'
import mongoose from 'mongoose'
import Promise from 'bluebird'
import Account from '../models/account.model'
import User from '../models/user.model'
import Question from '../models/question.model'
import Comment from '../models/comment.model'
import MailList from '../models/mail_list.model'
import MailCampaign from '../models/mail_campaign.model'
import MailSender from '../models/mail_sender.model'
import email from '../services/email'

export default {
  getAccounts: (req, res) => {
    let search = {},
      sort = { createdAt: -1 },
      page = 1,
      pageSize = 10

    if (req.query.sortField) {
      sort = {
        [req.query.sortField]: req.query.sortOrder === 'descend' ? 1 : -1
      }
    }

    if (typeof req.query.page !== 'undefined') {
      page = parseInt(req.query.page) || page
    }
    if (typeof req.query.pageSize !== 'undefined') {
      pageSize = parseInt(req.query.pageSize) || pageSize
    }

    if (req.query.uid) {
      search['user'] = req.query.uid
    }

    Promise.resolve()
      .then(() => {
        if (!req.query.searchText) {
          return Promise.resolve()
        } else {
          return User.find({
            username: {
              $regex: new RegExp(req.query.searchText),
              $options: 'i'
            }
          })
            .select('_id')
            .lean()
        }
      })
      .then(ids => {
        if (typeof ids !== 'undefined' && !search['user']) {
          search['user'] = { $in: ids }
        }
        return Promise.all([
          Account.find(search)
            .populate('user')
            .lean()
            .sort(sort)
            .limit(pageSize)
            .skip(pageSize * (page - 1)),
          Account.find(search).count()
        ])
      })
      .then(([accounts, total]) => {
        res.sendSuccess({ accounts, total })
      })
      .catch(err => {
        return res.sendError(err)
      })
  },

  getQuestns: (req, res) => {
    let search = {},
      sort = { createdAt: -1 },
      page = 1,
      pageSize = 10

    if (req.query.sortField) {
      sort = {
        [req.query.sortField]: req.query.sortOrder === 'descend' ? 1 : -1
      }
    }

    if (req.query.qid) {
      search['_id'] = req.query.qid
    }
    if (req.query.searchText) {
      search['$or'] = [
        {
          title: {
            $regex: new RegExp(req.query.searchText),
            $options: 'i'
          }
        },
        {
          keywords: {
            $elemMatch: {
              $regex: new RegExp(req.query.searchText),
              $options: 'i'
            }
          }
        }
      ]
    }

    if (typeof req.query.page !== 'undefined') {
      page = parseInt(req.query.page) || page
    }
    if (typeof req.query.pageSize !== 'undefined') {
      pageSize = parseInt(req.query.pageSize) || pageSize
    }
    Promise.resolve()
      .then(() => {
        if (!req.query.searchTextOwner) {
          return Promise.resolve()
        } else {
          return User.find({
            username: {
              $regex: new RegExp(req.query.searchTextOwner),
              $options: 'i'
            }
          })
            .select('_id')
            .lean()
        }
      })
      .then(ids => {
        if (typeof ids !== 'undefined') {
          search['owner'] = { $in: ids }
        }
        return Promise.all([
          Question.find(search)
            .populate('owner')
            .populate('votes')
            .populate('tags')
            .populate('marks')
            .select('+counters')
            .sort(sort)
            .limit(pageSize)
            .skip(pageSize * (page - 1)),
          Question.find(search).count()
        ])
      })
      .then(data => {
        res.sendSuccess({ questions: data[0], total: data[1] })
      })
      .catch(err => {
        return res.sendError(err)
      })
  },

  toggleSuspended: (req, res) => {
    if (!req.params.id || req.account._id.equals(req.params.id)) {
      return res.sendError(CONST.ERROR.WRONG_REQUEST)
    }
    Account.findById(req.params.id)
      .then(account => {
        if (!account) {
          return Promise.reject(CONST.ERROR.WRONG_REQUEST)
        }
        account.isSuspended = !account.isSuspended
        return account.save()
      })
      .then(() => {
        return res.sendSuccess()
      })
      .catch(err => {
        return res.sendError(err)
      })
  },

  toggleAdmin: (req, res) => {
    if (!req.params.id || req.account._id.equals(req.params.id)) {
      return res.sendError(CONST.ERROR.WRONG_REQUEST)
    }
    Account.findById(req.params.id)
      .then(account => {
        if (!account) {
          return Promise.reject(CONST.ERROR.WRONG_REQUEST)
        }
        account.isAdmin = !account.isAdmin
        return account.save()
      })
      .then(() => {
        return res.sendSuccess()
      })
      .catch(err => {
        return res.sendError(err)
      })
  },

  deleteQuestion: (req, res) => {
    Question.deleteQuestion(req.params.id)
      .then(() => {
        res.sendSuccess()
      })
      .catch(err => {
        res.sendError(err)
      })
  },

  getComments: (req, res) => {
    let search = {},
      sort = { createdAt: -1 },
      page = 1,
      pageSize = 10

    if (req.query.sortField) {
      sort = {
        [req.query.sortField]: req.query.sortOrder === 'descend' ? 1 : -1
      }
    }

    if (req.query.searchText) {
      search.text = {
        $regex: new RegExp(req.query.searchText),
        $options: 'i'
      }
    }

    if (typeof req.query.page !== 'undefined') {
      page = parseInt(req.query.page) || page
    }
    if (typeof req.query.pageSize !== 'undefined') {
      pageSize = parseInt(req.query.pageSize) || pageSize
    }
    Promise.resolve()
      .then(() => {
        if (!req.query.searchTextOwner) {
          return Promise.resolve()
        } else {
          return User.find({
            username: {
              $regex: new RegExp(req.query.searchTextOwner),
              $options: 'i'
            }
          })
            .select('_id')
            .lean()
        }
      })
      .then(ids => {
        if (typeof ids !== 'undefined') {
          search['owner'] = { $in: ids }
        }
        return Promise.all([
          Comment.find(search)
            .populate('owner')
            .populate('question')
            .populate('marks')
            .select('+counters')
            .sort(sort)
            .limit(pageSize)
            .skip(pageSize * (page - 1)),
          Comment.find(search).count()
        ])
      })
      .then(data => {
        res.sendSuccess({ comments: data[0], total: data[1] })
      })
      .catch(err => {
        return res.sendError(err)
      })
  },

  deleteComment: (req, res) => {
    Comment.findById(req.params.id)
      .then(comment => {
        if (!comment) {
          return Promise.reject(CONST.ERROR.WRONG_REQUEST)
        }
        return comment.delete()
      })
      .then(() => {
        res.sendSuccess()
      })
      .catch(err => {
        res.sendError(err)
      })
  },

  getMailLists: (req, res) => {
    MailList.find({})
      .lean()
      .then(lists => {
        return Promise.all(_.map(lists, l => email.getList(l.sendgridId))).then(
          data => {
            return Promise.resolve(
              _.map(lists, (list, index) => Object.assign(list, data[index]))
            )
          }
        )
      })
      .then(lists => {
        res.sendSuccess({ lists })
      })
      .catch(err => {
        res.sendError(err)
      })
  },

  getMailCampaigns: (req, res) => {
    MailCampaign.find({})
      .lean()
      .then(campaigns => {
        res.sendSuccess({ campaigns })
      })
      .catch(err => {
        res.sendError(err)
      })
  },

  createMailCampaign: (req, res) => {
    new MailCampaign(req.body)
      .save()
      .then(() => {
        res.sendSuccess({})
      })
      .catch(err => {
        res.sendError(err)
      })
  },

  updateMailCampaign: (req, res) => {
    let data = req.body
    if (data.html_content) {
      data.sendgridId = null
    }
    MailCampaign.update({ _id: req.params.id }, data)
      .then(() => {
        res.sendSuccess({})
      })
      .catch(err => {
        res.sendError(err)
      })
  },

  deleteMailCampaign: (req, res) => {
    MailCampaign.findByIdAndRemove(req.params.id)
      .then(() => {
        res.sendSuccess({})
      })
      .catch(err => {
        res.sendError(err)
      })
  },

  toggleMailCampaignTest: (req, res) => {
    MailCampaign.findOne({ _id: req.params.id })
      .then(campaign => {
        if (!campaign) {
          return Promise.reject(CONST.ERROR.WRONG_REQUEST)
        }
        campaign.isTest = !campaign.isTest
        return campaign.save()
      })
      .then(() => {
        res.sendSuccess({})
      })
      .catch(err => {
        res.sendError(err)
      })
  },

  toggleMailCampaignScheduled: (req, res) => {
    MailCampaign.findOne({ _id: req.params.id })
      .then(campaign => {
        if (!campaign) {
          return Promise.reject(CONST.ERROR.WRONG_REQUEST)
        }
        campaign.isScheduled = !campaign.isScheduled
        return campaign.save()
      })
      .then(() => {
        res.sendSuccess({})
      })
      .catch(err => {
        res.sendError(err)
      })
  },

  sendMailCampaign: (req, res) => {
    MailCampaign.findOne({ _id: req.params.id })
      .then(model => {
        if (!model) {
          return Promise.reject(CONST.ERROR.WRONG_REQUEST)
        }
        if (req.query.test && !model.isTest) {
          return Promise.reject(CONST.ERROR.WRONG_REQUEST)
        }
        if (model.sendgridId) {
          return Promise.resolve([model.sendgridId, model])
        }
        return Promise.all([
          MailSender.findOne({}).lean(),
          MailList.find({}).lean()
        ]).then(([sender, lists]) => {
          return email
            .createCampaign(
              sender.sendgridId,
              _.map(lists, 'sendgridId'),
              process.env.MAIL_UNSUB_GROUP_ID,
              model.toJSON()
            )
            .then(campaign => {
              return Promise.resolve([campaign.id, model])
            })
        })
      })
      .then(([campaignId, model]) => {
        if (model.isTest) {
          return email.sendTestCampaign(campaignId, model.testTo).then(() => {
            model.sendgridId = campaignId
            model.lastSentAt = Date.now()
            return model.save()
          })
        } else {
          return email.sendCampaign(campaignId).then(() => {
            model.sendgridId = null
            model.lastSentAt = Date.now()
            return model.save()
          })
        }
      })
      .then(() => {
        res.sendSuccess({})
      })
      .catch(err => {
        res.sendError(err)
      })
  }
}
