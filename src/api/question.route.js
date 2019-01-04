import CONST from "../const"
import Question from "../models/question.model"
import Promise from "bluebird"

export default {
	create: (req, res) => {
		if (!req.body.title) {
			return Promise.reject(CONST.ERROR.WRONG_REQUEST)
		}
		let question = new Question({
			owner: req.account.user,
			title: req.body.title,
			keywords: req.body.keywords || []
		})
		question
			.save()
			.then(question => {
				res.sendSuccess({ question })
			})
			.catch(err => {
				res.sendError(err)
			})
	}
}
