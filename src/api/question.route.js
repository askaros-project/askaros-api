import _ from "lodash"
import CONST from "../const"
import Question from "../models/question.model"
import Activity from "../models/activity.model"
import Answer from "../models/answer.model"
import Tag from "../models/tag.model"
import Promise from "bluebird"
require("mongoose-query-random")

export default {
	getByUri: (req, res) => {
		if (!req.params.uri) {
			return Promise.reject(CONST.ERROR.WRONG_REQUEST)
		}
		Question.findOne({ uri: req.params.uri })
			.populate({ path: "answers", options: { lean: true } })
			.populate({ path: "tags", options: { lean: true } })
			.lean()
			.then(question => {
				if (question) {
					res.sendSuccess({ question })
				} else {
					res.sendError("Not found", 404)
				}
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	getCollection: (req, res) => {
		const types = ["random"]
		if (!req.params.type || types.indexOf(req.params.type) === -1) {
			return Promise.reject(CONST.ERROR.WRONG_REQUEST)
		}
		if (req.params.type === "random") {
			Question.find()
				.populate({ path: "answers", options: { lean: true } })
				.lean()
				.limit(5)
				.then(questions => {
					res.sendSuccess({ questions })
				})
				.catch(err => {
					res.sendError(err)
				})
		}
	},

	create: (req, res) => {
		if (!req.body.title) {
			return Promise.reject(CONST.ERROR.WRONG_REQUEST)
		}
		Question.createQuestion({
			owner: req.account.user,
			title: req.body.title,
			keywords: req.body.keywords || []
		})
			.then(question => {
				return Activity.push({
					type: CONST.ACTIVITY_TYPE.QUESTION,
					owner: req.account.user,
					question: question
				}).then(() => {
					res.sendSuccess({ question })
				})
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	vote: (req, res) => {
		if (!req.body.code) {
			return Promise.reject(CONST.ERROR.WRONG_REQUEST)
		}
		Question.findById(req.params.id)
			.populate({ path: "answers" })
			.then(q => {
				if (!q) {
					return Promise.reject(CONST.ERROR.WRONG_REQUEST)
				}
				const answer = _.find(q.answers, a => {
					return a.owner.equals(req.account.user) && a.question.equals(q._id)
				})
				if (answer) {
					return Promise.reject(CONST.ERROR.ALREADY_VOTED)
				}
				return Promise.all([
					Promise.resolve(q),
					new Answer({
						owner: req.account.user,
						question: q,
						code: req.body.code
					}).save()
				])
			})
			.then(([q, answer]) => {
				q.answers.push(answer)
				return q.save()
			})
			.then(q => {
				return Activity.push(
					{
						type: CONST.ACTIVITY_TYPE.ANSWER,
						owner: req.account.user,
						question: q
					},
					true
				)
			})
			.then(() => {
				return Question.findById(req.params.id)
					.populate({ path: "answers", options: { lean: true } })
					.populate({ path: "tags", options: { lean: true } })
					.lean()
					.then(question => {
						res.sendSuccess({ question })
					})
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	tag: (req, res) => {
		if (!req.body.code) {
			return Promise.reject(CONST.ERROR.WRONG_REQUEST)
		}
		Question.findById(req.params.id)
			.populate({ path: "tags" })
			.then(q => {
				if (!q) {
					return Promise.reject(CONST.ERROR.WRONG_REQUEST)
				}
				const tag = _.find(q.tags, a => {
					return a.owner.equals(req.account.user) && a.question.equals(q._id)
				})
				if (tag) {
					return Promise.reject(CONST.ERROR.ALREADY_TAGGED)
				}
				return Promise.all([
					Promise.resolve(q),
					new Tag({
						owner: req.account.user,
						question: q,
						code: req.body.code
					}).save()
				])
			})
			.then(([q, tag]) => {
				q.tags.push(tag)
				return q.save()
			})
			.then(q => {
				return Activity.push(
					{
						type: CONST.ACTIVITY_TYPE.TAG,
						owner: req.account.user,
						question: q
					},
					true
				)
			})
			.then(() => {
				return Question.findById(req.params.id)
					.populate({ path: "answers", options: { lean: true } })
					.populate({ path: "tags", options: { lean: true } })
					.lean()
					.then(question => {
						res.sendSuccess({ question })
					})
			})
			.catch(err => {
				res.sendError(err)
			})
	}
}
