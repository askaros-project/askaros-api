const log = require("../services/log")("user.route")
import CONST from "../const"
import _ from "lodash"
import mongoose from "mongoose"
import Promise from "bluebird"
import Account from "../models/account.model"
import User from "../models/user.model"

export default {
  getAccounts: (req, res) => {
    let search = {},
      sort = { createdAt: -1 },
      page = 1,
      pageSize = 10

    // if (req.query.status) {
    //   search.status = req.query.status;
    // }
    // if (req.query.name) {
    //   search['personalInfo.fullName'] = {'$regex' : new RegExp(req.query.name, 'i')}
    // }
    // if (req.query.email) {
    //   search['personalInfo.email'] = {'$regex' : new RegExp(req.query.email, 'i')}
    // }
    // if (req.query.phone) {
    //   search['personalInfo.phone'] = {'$regex' : new RegExp(req.query.phone, 'i')}
    // }
    // if (req.query.addons) {
    //   search['addons'] = req.query.addons
    // }

    // if (req.query.sort) {
    //   sort = {[req.query.sort] : req.query.sortOrder || -1}
    // }
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
        /***/ log.warn(err)
        return res.sendError()
      })
  }
  //
  //   deleteOrder: (req, res) => {
  //     OrderModel.findOneAndRemove({_id: req.params.id})
  //       .then(() => {
  //         return res.sendSuccess({});
  //       })
  //   },
  //
  //   createOrder: (req, res) => {
  //     const data = _.omit(req.body, ['_id', 'createdAt']);
  //     let order = new OrderModel(data)
  //     order
  //       .save()
  //       .then((order) => {
  //         if (req.body.id) {
  //           // rewrite autoincremented id
  //           order.id = req.body.id
  //           return order.save()
  //         } else {
  //           return order
  //         }
  //       })
  //       .then((order) => {
  //         return res.sendSuccess({order});
  //       })
  //       .catch((err) => {
  //         /***/ log.warn(err)
  //         return res.sendError();
  //       })
  //   },
  //
  //   updateOrder: (req, res) => {
  //     const data = _.omit(req.body, ['_id', 'createdAt']);
  //     OrderModel.findOneAndUpdate({_id: req.params.id}, data)
  //       .select('+adminNotes')
  //       .then(() => {
  //         return res.sendSuccess({});
  //       })
  //       .catch((err) => {
  //         /***/ log.warn(err);
  //         return res.sendError();
  //       })
  //   }
}
