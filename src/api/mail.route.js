import _ from 'lodash'
import moment from 'moment'
import MailSender from '../models/mail_sender.model'
import MailList from '../models/mail_list.model'
import MailCampaign from '../models/mail_campaign.model'
import CONST from '../const'
import mongoose from 'mongoose'
import Promise from 'bluebird'
import email from '../services/email'

export default {
	addSubscriber: (req, res) => {
		if (!req.body.email) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		email.addRecepient(req.body.email).then(recepId => {
			return MailList.findOne({ type: CONST.MAIL_LIST.SUBSCRIBERS })
				.then(maillist => {
					if (!maillist) {
						return Promise.reject('MailList for subscribers not found!')
					}
					return email.addRecepientToList(recepId, maillist.sendgridId)
				})
				.then(() => {
					res.sendSuccess({})
				})
				.catch(err => {
					res.sendError(err)
				})
		})
	}
}
