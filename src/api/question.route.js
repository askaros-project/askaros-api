import _ from "lodash"
import CONST from "../const"
import Question from "../models/question.model"
import Activity from "../models/activity.model"
import Vote from "../models/vote.model"
import Tag from "../models/tag.model"
import Mark from "../models/mark.model"
import Promise from "bluebird"
require("mongoose-query-random")

const prepareVotes = (question, userId) => {
	let items = question.votes
	question.votes = {
		total: question.votes.length,
		counts: {
			[CONST.VOTE.YES]: 0,
			[CONST.VOTE.NO]: 0
		},
		selected: undefined
	}
	for (let i = 0; i < items.length; i++) {
		if (items[i].code === CONST.VOTE.YES) {
			question.votes.counts[CONST.VOTE.YES]++
		} else {
			question.votes.counts[CONST.VOTE.NO]++
		}
		if (userId && items[i].owner.equals(userId)) {
			question.votes.selected = items[i].code
		}
	}
	return Promise.resolve(question)
}

const prepareTags = (question, userId) => {
	let items = question.tags
	question.tags = {
		counts: {},
		selected: undefined
	}
	for (let i = 0; i < items.length; i++) {
		let code = items[i].code
		question.tags.counts[code] = question.tags.counts[code]
			? question.tags.counts[code] + 1
			: 1
		if (userId && items[i].owner.equals(userId)) {
			question.tags.selected = code
		}
	}
	return Promise.resolve(question)
}

const prepareMarks = (question, userId) => {
	let items = question.marks
	question.marks = { items: [] }
	if (userId) {
		question.marks.items = _.filter(items, m => m.owner.equals(userId))
	}
	return Promise.resolve(question)
}

const prepareToClient = (req, question) => {
	const userId = req.account ? req.account.user : null
	const detailed = req.query.detailed
	return prepareVotes(question, userId)
		.then(() => {
			if (detailed) {
				return prepareTags(question, userId)
			} else {
				delete question.tags
				return Promise.resolve(question)
			}
		})
		.then(question => {
			if (detailed) {
				return prepareMarks(question, userId)
			} else {
				delete question.marks
				return Promise.resolve(question)
			}
		})
}

const populateQuery = (req, query) => {
	if (!req.query.detailed) {
		return query.populate({ path: "votes", options: { lean: true } })
	}
	return query
		.populate({ path: "votes", options: { lean: true } })
		.populate({ path: "tags", options: { lean: true } })
		.populate({ path: "marks", options: { lean: true } })
}

export default {
	getByUri: (req, res) => {
		if (!req.params.uri) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		populateQuery(req, Question.findOne({ uri: req.params.uri }))
			.lean()
			.then(question => {
				if (!question) {
					return res.sendError(CONST.ERROR.NOT_FOUND, 404)
				}
				return prepareToClient(req, question)
			})
			.then(question => {
				res.sendSuccess({ question })
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	getCollection: (req, res) => {
		const types = ["random"]
		if (!req.params.type || types.indexOf(req.params.type) === -1) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		if (req.params.type === "random") {
			Question.find()
				.populate({ path: "votes", options: { lean: true } })
				.lean()
				.limit(5)
				.then(questions => {
					return Promise.all(_.map(questions, q => prepareToClient(req, q)))
				})
				.then(questions => {
					return res.sendSuccess({ questions })
				})
				.catch(err => {
					res.sendError(err)
				})
		}
	},

	create: (req, res) => {
		if (!req.body.title) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
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
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		Question.findById(req.params.id)
			.populate({ path: "votes" })
			.select("+counters")
			.then(q => {
				if (!q) {
					return res.sendError(CONST.ERROR.WRONG_REQUEST)
				}
				const vote = _.find(q.votes, a => {
					return a.owner.equals(req.account.user) && a.question.equals(q._id)
				})
				if (vote) {
					return Promise.reject(CONST.ERROR.ALREADY_VOTED)
				}
				return Promise.all([
					Promise.resolve(q),
					new Vote({
						owner: req.account.user,
						question: q,
						code: req.body.code
					}).save()
				])
			})
			.then(([q, vote]) => {
				q.votes.push(vote)
				q.counters.votes = q.counters.votes + 1
				return q.save()
			})
			.then(q => {
				return Activity.push(
					{
						type: CONST.ACTIVITY_TYPE.VOTE,
						owner: req.account.user,
						question: q
					},
					true
				)
			})
			.then(() => {
				return populateQuery(req, Question.findById(req.params.id))
					.lean()
					.then(question => {
						return prepareToClient(req, question)
					})
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
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		Question.findById(req.params.id)
			.populate({ path: "tags" })
			.select("+counters")
			.then(q => {
				if (!q) {
					return res.sendError(CONST.ERROR.WRONG_REQUEST)
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
				q.counters.tags = q.counters.tags + 1
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
				return populateQuery(req, Question.findById(req.params.id))
					.lean()
					.then(question => {
						return prepareToClient(req, question)
					})
					.then(question => {
						res.sendSuccess({ question })
					})
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	mark: (req, res) => {
		if (!req.body.code) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		Question.findById(req.params.id)
			.populate({ path: "marks", options: { lean: true } })
			.select("+counters")
			.then(q => {
				if (!q) {
					return res.sendError(CONST.ERROR.WRONG_REQUEST)
				}
				const mark = _.find(q.marks, m => {
					return m.owner.equals(req.account.user) && m.code === req.body.code
				})
				if (mark) {
					return Promise.reject(CONST.ERROR.ALREADY_MARKED)
				}
				return Promise.all([
					Promise.resolve(q),
					new Mark({
						owner: req.account.user,
						question: q,
						code: req.body.code
					}).save()
				])
			})
			.then(([q, mark]) => {
				q.marks.push(mark)
				if (req.body.code === CONST.MARK.SPAM) {
					q.counters.spam_mark = q.counters.spam_mark + 1
				}
				return q.save()
			})
			.then(question => {
				return populateQuery(req, Question.findById(req.params.id))
					.lean()
					.then(question => {
						return prepareToClient(req, question)
					})
					.then(question => {
						res.sendSuccess({ question: question })
					})
			})
			.catch(err => {
				res.sendError(err)
			})
	}
}
