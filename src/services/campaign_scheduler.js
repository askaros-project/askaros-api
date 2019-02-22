import _ from 'lodash'
import moment from 'moment'
import MailSender from '../models/mail_sender.model'
import MailList from '../models/mail_list.model'
import MailCampaign from '../models/mail_campaign.model'
import CONST from '../const'
import mongoose from 'mongoose'
import Promise from 'bluebird'
import email from './email'

export default {
	init() {
		setInterval(() => {
			MailCampaign.find({ isScheduled: true }).then(models => {
				for (let i = 0; i < models.length; i++) {
					let model = models[i]
					if (!model.eachDays) continue
					let lastSentDate = moment(
						new Date(model.lastSentAt || model.createdAt)
					)
					lastSentDate.add(model.eachDays, 'days')
					if (
						lastSentDate.format('YYYYMMDDHHmm') <
						moment().format('YYYYMMDDHHmm')
					) {
						Promise.resolve()
							.then(() => {
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
									return email
										.sendTestCampaign(campaignId, model.testTo)
										.then(() => {
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
						break
					}
				}
			})
		}, 15 * 60 * 1000)
	}
}
