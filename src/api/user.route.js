import _ from 'lodash'
import User from '../models/user.model'
import CONST from '../const'
import mongoose from 'mongoose'
import Promise from 'bluebird'
import emailSender from '../services/email'

export default {
	update: (req, res) => {
		if (!req.body.username) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		User.findById(req.account.user)
			.select('+allowedNotif')
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
	},

	subscribe: (req, res) => {
		if (!req.params.type) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		User.findById(req.account.user)
			.select('+allowedNotif +email')
			.then(user => {
				if (req.params.type === CONST.NOTIF_TYPE.TRANDING && user.email) {
					return emailSender
						.removeFromUnsub(req.params.type, user.email)
						.then(() => user)
				}
				return user
			})
			.then(user => {
				if (user.allowedNotif.indexOf(req.params.type) === -1) {
					user.allowedNotif.push(req.params.type)
					user.markModified('allowedNotif')
					return user.save()
				}
				return user
			})
			.then(user => {
				res.sendSuccess({ user: user })
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	unsubscribe: (req, res) => {
		if (!req.params.type) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		User.findById(req.account.user)
			.select('+allowedNotif +email')
			.then(user => {
				if (req.params.type === CONST.NOTIF_TYPE.TRANDING && user.email) {
					return emailSender
						.addToUnsub(req.params.type, user.email)
						.then(() => user)
				}
				return user
			})
			.then(user => {
				const index = user.allowedNotif.indexOf(req.params.type)
				if (index !== -1) {
					user.allowedNotif.splice(index, 1)
					user.markModified('allowedNotif')
					return user.save()
				}
				return user
			})
			.then(user => {
				res.sendSuccess({ user: user })
			})
			.catch(err => {
				res.sendError(err)
			})
	}
}
