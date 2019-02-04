import _ from 'lodash'
import mongoose from 'mongoose'
import Promise from 'bluebird'
import emailSender from '../services/email'
import validation from '../services/validation'
import Feedback from '../models/feedback.model'

export default {
	addMessage: (req, res) => {
		const data = _.pick(req.body, ['name', 'email', 'message'])
		if (!data.name || !data.email || !data.message) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		return validation
			.validate(data, {
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
