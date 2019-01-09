const log = require("../services/log")("user.route")
import CONST from "../const"
import _ from "lodash"
import mongoose from "mongoose"
import Promise from "bluebird"
import Account from "../models/account.model"
import User from "../models/user.model"
import Question from "../models/question.model"

export default {
  getAccounts: (req, res) => {
    let search = {},
      sort = { createdAt: -1 },
      page = 1,
      pageSize = 10

    if (req.query.sortField) {
      sort = {
        [req.query.sortField]: req.query.sortOrder === "descend" ? 1 : -1
      }
    }

    if (typeof req.query.page !== "undefined") {
      page = parseInt(req.query.page) || page
    }
    if (typeof req.query.pageSize !== "undefined") {
      pageSize = parseInt(req.query.pageSize) || pageSize
    }
    Promise.all([
      Account.find(search)
        .populate("user")
        .sort(sort)
        .limit(pageSize)
        .skip(pageSize * (page - 1)),
      Account.find(search).count()
    ])
      .then(data => {
        res.sendSuccess({ accounts: data[0], total: data[1] })
      })
      .catch(err => {
        return res.sendError()
      })
  },

  getQuestns: (req, res) => {
    let search = {},
      sort = { createdAt: -1 },
      page = 1,
      pageSize = 10

    if (req.query.sortField) {
      sort = {
        [req.query.sortField]: req.query.sortOrder === "descend" ? 1 : -1
      }
    }

    if (req.query.searchText) {
      search["$or"] = [
        { title: { $regex: new RegExp(req.query.searchText), $options: "i" } },
        {
          keywords: {
            $elemMatch: {
              $regex: new RegExp(req.query.searchText),
              $options: "i"
            }
          }
        }
      ]
    }

    if (typeof req.query.page !== "undefined") {
      page = parseInt(req.query.page) || page
    }
    if (typeof req.query.pageSize !== "undefined") {
      pageSize = parseInt(req.query.pageSize) || pageSize
    }
    Promise.all([
      Question.find(search)
        .populate("owner")
        .populate("votes")
        .populate("tags")
        .populate("marks")
        .select("+counters")
        .sort(sort)
        .limit(pageSize)
        .skip(pageSize * (page - 1)),
      Question.find(search).count()
    ])
      .then(data => {
        res.sendSuccess({ questions: data[0], total: data[1] })
      })
      .catch(err => {
        return res.sendError()
      })
  },

  deleteQuestion: (req, res) => {
    Question.findById(req.params.id)
      .remove()
      .exec()
      .then(() => {
        res.sendSuccess()
      })
      .catch(err => {
        res.sendError()
      })
  }
}
