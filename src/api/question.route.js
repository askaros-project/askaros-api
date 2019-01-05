import CONST from "../const"
import Question from "../models/question.model"
import Activity from "../models/activity.model"
import Answer from "../models/answer.model"
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
	}
}
