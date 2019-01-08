import _ from "lodash"
import User from "../models/user.model"
import CONST from "../const"
import mongoose from "mongoose"
import Promise from "bluebird"

export default {
	update: (req, res) => {
		if (!req.body.username) {
			return Promise.reject(CONST.ERROR.WRONG_REQUEST)
		}
		User.findById(req.account.user)
			.then(user => {
				user.username = req.body.username
				user.location = req.body.location
				user.descr = req.body.descr
				return user.save()
			})
			.then(user => {
				res.sendSuccess({ user: user })
			})
			.catch(err => {
				res.sendError(err)
			})
	}
}
