import _ from "lodash"
import CONST from "../const"
import Question from "../models/question.model"
import Comment from "../models/comment.model"
import Promise from "bluebird"

export default {
	load: (req, res) => {
		Comment.find({ question: req.params.qid })
			.populate({ path: "owner", options: { lean: true } })
			.lean()
			.then(items => {
				res.sendSuccess({ items })
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	add: (req, res) => {
		if (!req.body.text) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		Question.findById(req.params.qid)
			.select("+comments")
			.select("+counters")
			.then(q => {
				if (!q) {
					return res.sendError(CONST.ERROR.WRONG_REQUEST)
				}
				return Promise.all([
					Promise.resolve(q),
					new Comment({
						owner: req.account.user,
						question: q,
						text: req.body.text,
						replyTo: req.body.replyTo
					}).save()
				])
			})
			.then(([q, comment]) => {
				q.comments.push(comment)
				q.counters.comments = q.counters.comments + 1
				return q.save().then(() => {
					return Comment.findById(comment._id)
						.populate({ path: "owner", options: { lean: true } })
						.lean()
				})
			})
			.then(comment => {
				res.sendSuccess({ comment: comment })
			})
			.catch(err => {
				res.sendError(err)
			})
	}
}
