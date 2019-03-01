import _ from 'lodash'
import mongoose from 'mongoose'
import Promise from 'bluebird'
import emailSender from '../services/email'
import validation from '../services/validation'
import captcha from '../services/captcha'
import Feedback from '../models/feedback.model'
import CONST from '../const'

export default {
	addMessage: (req, res) => {
		const data = _.pick(req.body, ['name', 'email', 'message', 'verifyToken'])
		if (!data.name || !data.email || !data.message || !data.verifyToken) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		return captcha
			.verify(data.verifyToken)
			.then(verified => {
				if (!verified) {
					return Promise.reject(CONST.ERROR.NOT_VERIFIED)
				}
				return validation.validate(data, {
					name: {
						type: 'string',
						required: true,
						allowEmpty: false,
						trim: true
					},
					email: {
						type: 'string',
						required: true,
						allowEmpty: false,
						trim: true,
						format: 'email'
					},
					message: {
						type: 'string',
						required: true,
						allowEmpty: false,
						trim: true
					}
				})
			})
			.then(() => {
				return new Feedback(data).save()
			})
			.then(feedback => {
				return emailSender.sendFeedback(data.name, data.email, data.message)
			})
			.then(() => {
				res.sendSuccess()
			})
			.catch(err => {
				res.sendError(err)
			})
	}
}
