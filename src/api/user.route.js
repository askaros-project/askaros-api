import _ from 'lodash'
import User from '../models/user.model'
import CONST from '../const'
import mongoose from 'mongoose'
import Promise from 'bluebird'

export default {
	update: (req, res) => {
		if (!req.body.username) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		User.findById(req.account.user)
			.then(user => {
				user.username = req.body.username
				user.descr = req.body.descr
				user.place = req.body.place
				user.birthyear = req.body.birthyear
				user.sex = req.body.sex
				user.education = req.body.education
				user.income = req.body.income
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
