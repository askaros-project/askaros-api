import _ from "lodash"
import CONST from "../const"
import Question from "../models/question.model"
import Activity from "../models/activity.model"
import Answer from "../models/answer.model"
import Rtag from "../models/rtag.model"
import Promise from "bluebird"

export default {
	getByUri: (req, res) => {
		if (!req.params.uri) {
			return Promise.reject(CONST.ERROR.WRONG_REQUEST)
		}
		Question.findOne({ uri: req.params.uri })
			.populate({ path: "answers", options: { lean: true } })
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
					type: CONST.ACTIVITY_TYPE.QUESTION_CREATED,
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
			.then(() => {
				res.sendSuccess()
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	rtag: (req, res) => {
		if (!req.body.code) {
			return Promise.reject(CONST.ERROR.WRONG_REQUEST)
		}
		Question.findById(req.params.id)
			.populate({ path: "rtags" })
			.then(q => {
				if (!q) {
					return Promise.reject(CONST.ERROR.WRONG_REQUEST)
				}
				const rtag = _.find(q.rtags, a => {
					return a.owner.equals(req.account.user) && a.question.equals(q._id)
				})
				if (rtag) {
					return Promise.reject(CONST.ERROR.ALREADY_TAGED)
				}
				return Promise.all([
					Promise.resolve(q),
					new Rtag({
						owner: req.account.user,
						question: q,
						code: req.body.code
					}).save()
				])
			})
			.then(([q, rtag]) => {
				q.rtags.push(rtag)
				return q.save()
			})
			.then(() => {
				res.sendSuccess()
			})
			.catch(err => {
				res.sendError(err)
			})
	}
}
