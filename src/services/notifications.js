import _ from 'lodash'
import CONST from '../const'
import moment from 'moment'
import Notification from '../models/notification.model'
import Mark from '../models/mark.model'
import emailSender from './email'

const Promise = require('bluebird')

const MONITOR_INTERVAL = 1 * 60 * 1000
const ATTEMPT_PERIOD = 10 * 60 * 1000

const _getNotifText = notif => {
	let text =
		notif.type === CONST.NOTIF_TYPE.SOMEONE_COMMENT_YOUR_Q
			? 'Someone comment your question '
			: 'Someone comment same question '
	text += `<a target="_blank" href="${process.env.SITE_URL}/q/${
		notif.question.uri
	}">${notif.question.title}</a>`

	text += `<p><a target="_blank" href="${
		process.env.SITE_URL
	}/profile/subscriptions">Unsibscribe</a></p>`

	return text
}

/* Start notifications sender */
setInterval(() => {
	/***/ console.info('[Notification service] starts..')
	Notification.find({
		status: CONST.NOTIF_STATUS.NEW
	})
		.populate({
			path: 'owner',
			options: { lean: true, select: '+email +allowedNotif' }
		})
		.populate({ path: 'question', options: { lean: true } })
		.then(notifs => {
			/***/ console.info(
				`[Notification service] found ${notifs.length} notifications`
			)

			notifs.forEach(notif => {
				if (
					!notif.owner.email ||
					notif.owner.allowedNotif.indexOf(notif.type) === -1
				) {
					notif.status = CONST.NOTIF_STATUS.NOT_ALLOWED
					notif.save()
					return
				}

				// check if users marks this question as "BLOCK_NOTIF"
				Mark.findOne({
					owner: notif.owner,
					question: notif.question,
					code: CONST.MARK.BLOCK_NOTIF
				})
					.lean()
					.then(mark => {
						if (mark) {
							notif.status = CONST.NOTIF_STATUS.NOT_ALLOWED
							notif.save()
							return
						}
						if (
							notif.attempts === 0 ||
							new Date(notif.attemptAt).getTime() + ATTEMPT_PERIOD <= Date.now()
						) {
							return emailSender
								.sendNotification({
									email: notif.owner.email,
									name: notif.owner.username,
									text: _getNotifText(notif)
								})
								.then(() => {
									notif.status = CONST.NOTIF_STATUS.SENT
									return notif.save()
								})
								.catch(err => {
									/**/ console.warn(
										'[Notification service] warn - cannot send notif email cause',
										err
									)
									notif.attempts = notif.attempts + 1
									notif.attemptAt = Date.now()
									if (notif.attempts >= 3) {
										notif.status = CONST.NOTIF_STATUS.FAILED
									}
									return notif.save()
								})
						}
					})
			})
		})
}, MONITOR_INTERVAL)

export default {
	create({ type, owner, question }) {
		return Notification.findOne({
			type: type,
			owner: owner,
			question: question,
			status: { $in: [CONST.NOTIF_STATUS.NEW, CONST.NOTIF_STATUS.SENT] }
		})
			.lean()
			.then(notif => {
				if (notif) {
					return
				}
				return new Notification({
					type,
					owner,
					question
				}).save()
			})
	},

	markAsReceived({ owner, question }) {
		return Notification.findOneAndUpdate(
			{
				owner,
				question,
				status: { $in: [CONST.NOTIF_STATUS.NEW, CONST.NOTIF_STATUS.SENT] }
			},
			{ status: CONST.NOTIF_STATUS.RECEIVED }
		).lean()
	}
}
