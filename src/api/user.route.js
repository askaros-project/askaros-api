const log = require("../services/log")("user.route")
import _ from "lodash"
import User from "../models/user.model"
import CONST from "../const"
import mongoose from "mongoose"
import config from "../config"
import Promise from "bluebird"

export default {
	// getData: (req, res) => {
	// 	User.findById(req.account.user)
	// 		.then(user => {
	// 			res.sendSuccess({ user: user, isAdmin: req.account.isAdmin })
	// 		})
	// 		.catch(err => {
	// 			res.sendError(err)
	// 		})
	// }
}
