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
		let { page, pageSize } = req.query
		pageSize = parseInt(pageSize) || 25
		Promise.all([
			Activity.find({ owner: req.account.user })
				.populate({ path: "question", options: { lean: true } })
				.sort({ createdAt: -1 })
				.limit(pageSize)
				.skip(pageSize * (page - 1))
				.lean(),
			Activity.find({ owner: req.account.user }).count()
		])
			.then(([items, count]) => {
				return Activity.updateMany(
					{ owner: req.account.user, unread: true },
					{ unread: false }
				).then(() => {
					res.sendSuccess({ items, count })
				})
			})
			.catch(err => {
				res.sendError(err)
			})
	}
}
