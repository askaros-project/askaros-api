import CONST from "../const"
import Activity from "../models/activity.model"
import Promise from "bluebird"

export default {
	getCount: (req, res) => {
		Activity.find({ owner: req.account.user, unread: true })
			.count()
			.then(count => {
				res.sendSuccess({ count })
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	getItems: (req, res) => {
		Activity.find({ owner: req.account.user })
			.populate({ path: "question", options: { lean: true } })
			.lean()
			.then(items => {
				return Activity.updateMany(
					{ owner: req.account.user, unread: true },
					{ unread: false }
				).then(() => {
					res.sendSuccess({ items })
				})
			})
			.catch(err => {
				res.sendError(err)
			})
	}
}
