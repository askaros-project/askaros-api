import _ from 'lodash'
import CONST from '../const'
import Question from '../models/question.model'
import Comment from '../models/comment.model'
import Mark from '../models/mark.model'
import Activity from '../models/activity.model'
import Promise from 'bluebird'

const populateQuery = (req, query) => {
	return query
		.populate({ path: 'owner', options: { lean: true } })
		.populate({ path: 'marks', options: { lean: true } })
}

const prepareMarks = (comment, userId) => {
	let items = comment.marks
	comment.marks = {
		likes: 0
	}
	for (let i = 0; i < items.length; i++) {
		let code = items[i].code
		if (userId && items[i].owner.equals(userId)) {
			comment.marks[code] = true
		}
		if (items[i].code === CONST.MARK.LIKE) {
			comment.marks.likes++
		}
	}
	return Promise.resolve(comment)
}

const prepareToClient = (req, comment) => {
	const userId = req.account ? req.account.user : null
	return prepareMarks(comment, userId)
}

export default {
	load: (req, res) => {
		populateQuery(req, Comment.find({ question: req.params.qid }))
			.lean()
			.then(items => {
				return Promise.all(_.map(items, item => prepareToClient(req, item)))
			})
			.then(items => {
				res.sendSuccess({ items })
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	add: (req, res) => {
		if (!req.body.text || !req.body.qid) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		Question.findById(req.body.qid)
			.select('+comments')
			.select('+counters')
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
				return q
					.save()
					.then(() => {
						return Activity.push(
							{
								type: CONST.ACTIVITY_TYPE.COMMENT,
								owner: req.account.user,
								question: q,
								options: { replyTo: req.body.replyTo }
							},
							true
						)
					})
					.then(() => {
						return populateQuery(req, Comment.findById(comment._id)).lean()
					})
			})
			.then(comment => {
				return prepareToClient(req, comment)
			})
			.then(comment => {
				res.sendSuccess({ comment })
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	mark: (req, res) => {
		Comment.findById(req.params.id)
			.populate('marks')
			.then(comment => {
				if (!comment) {
					return res.sendError(CONST.ERROR.WRONG_REQUEST)
				}
				return Promise.all([
					comment,
					Mark.findOne({
						owner: req.account.user,
						comment: comment._id,
						code: req.params.code
					}).exec()
				])
			})
			.then(([comment, mark]) => {
				if (mark) {
					return mark.remove()
				} else {
					return new Mark({
						owner: req.account.user,
						comment: comment,
						code: req.params.code
					})
						.save()
						.then(mark => {
							comment.marks.push(mark)
							return comment.save()
						})
				}
			})
			.then(() => {
				return populateQuery(req, Comment.findById(req.params.id))
					.lean()
					.then(comment => {
						return prepareToClient(req, comment).then(comment => {
							res.sendSuccess({ comment })
						})
					})
			})
			.catch(err => {
				res.sendError(err)
			})
	}
}
