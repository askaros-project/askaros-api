import _ from 'lodash'
import CONST from '../const'
import Question from '../models/question.model'
import Activity from '../models/activity.model'
import Vote from '../models/vote.model'
import Tag from '../models/tag.model'
import Mark from '../models/mark.model'
import Comment from '../models/comment.model'
import Promise from 'bluebird'
require('mongoose-query-random')

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

const prepareComments = (question, userId) => {
	question.comments = { total: question.comments.length }
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
		.then(question => {
			if (detailed) {
				return prepareComments(question, userId)
			} else {
				delete question.comments
				return Promise.resolve(question)
			}
		})
}

const populateQuery = (req, query) => {
	if (!req.query.detailed) {
		return query.populate({ path: 'votes', options: { lean: true } })
	}
	return query
		.populate({ path: 'votes', options: { lean: true } })
		.populate({ path: 'tags', options: { lean: true } })
		.populate({ path: 'marks', options: { lean: true } })
		.populate({ path: 'comments', options: { lean: true } })
}

export default {
	getSearchQuestions: (req, res) => {
		let search = {}

		if (req.query.search) {
			search['$or'] = [
				{ title: { $regex: new RegExp(req.query.search), $options: 'i' } },
				{
					keywords: {
						$elemMatch: { $regex: new RegExp(req.query.search), $options: 'i' }
					}
				}
			]
		}

		Question.find(search)
			.limit(10)
			.then(questions => {
				res.sendSuccess({ questions })
			})
			.catch(err => {
				res.sendError(err)
			})
	},

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
		const types = ['random', 'related', 'trending', 'tag']
		const limit = req.query.limit || 5
		if (!req.params.type || types.indexOf(req.params.type) === -1) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}

		return Promise.resolve()
			.then(() => {
				if (req.params.type === 'tag') {
					return Tag.aggregate([
						{
							$match: { code: parseInt(req.query.code) }
						},
						{
							$group: { _id: '$question', count: { $sum: 1 } }
						},
						{
							$sort: {
								count: -1
							}
						},
						{
							$limit: limit
						}
					]).then(result => {
						let sortedIds = _.map(result, '_id')
						return Question.find({
							_id: { $in: sortedIds }
						})
							.populate({ path: 'votes', options: { lean: true } })
							.lean()
							.then(questions => {
								return questions.sort((q1, q2) => {
									return (
										_.findIndex(sortedIds, id => id.equals(q1._id)) -
										_.findIndex(sortedIds, id => id.equals(q2._id))
									)
								})
							})
					})
				} else if (req.params.type === 'trending') {
					var date = new Date()
					date.setDate(date.getDate() - 15) // last 15 days
					return Activity.aggregate([
						{
							$match: {
								createdAt: { $gte: date },
								type: {
									$in: [
										CONST.ACTIVITY_TYPE.TAG,
										CONST.ACTIVITY_TYPE.VOTE,
										CONST.ACTIVITY_TYPE.COMMENT
									]
								}
							}
						},
						{
							$group: { _id: '$question', count: { $sum: 1 } }
						},
						{
							$sort: {
								count: -1
							}
						},
						{
							$limit: 100 // Activity may have deleted questions. Lets filter its after
						}
					]).then(result => {
						let sortedIds = _.map(result, '_id')
						return Question.find({
							_id: { $in: sortedIds }
						})
							.populate({ path: 'votes', options: { lean: true } })
							.lean()
							.limit(limit)
							.then(questions => {
								return questions.sort((q1, q2) => {
									return (
										_.findIndex(sortedIds, id => id.equals(q1._id)) -
										_.findIndex(sortedIds, id => id.equals(q2._id))
									)
								})
							})
					})
				} else if (req.params.type === 'random') {
					return Question.find()
						.select('_id')
						.lean()
						.then(ids => {
							if (ids.length <= limit) {
								return Question.find()
									.populate({ path: 'votes', options: { lean: true } })
									.lean()
							} else {
								let randomIndexes = []
								while (randomIndexes.length < limit) {
									let index = _.random(0, ids.length - 1)
									if (randomIndexes.indexOf(index) === -1) {
										randomIndexes.push(index)
									}
								}
								return Question.find({
									_id: { $in: _.map(randomIndexes, i => ids[i]) }
								})
									.lean()
									.populate({ path: 'votes', options: { lean: true } })
							}
						})
				} else if (req.params.type === 'related') {
					return Question.findById(req.query.qid)
						.lean()
						.then(q => {
							if (!q) {
								return Promise.reject(CONST.ERROR.WRONG_REQUEST)
							}
							if (!q.keywords.length) {
								return Promise.resolve([])
							} else {
								return Question.find({
									_id: { $ne: q._id },
									keywords: { $in: q.keywords }
								})
									.populate({ path: 'votes', options: { lean: true } })
									.lean()
									.limit(limit)
							}
						})
				}
			})
			.then(questions => {
				return Promise.all(_.map(questions, q => prepareToClient(req, q)))
			})
			.then(questions => {
				res.sendSuccess({ questions })
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	getProfileQuestions: (req, res) => {
		const pageSize = parseInt(req.query.pageSize) || 25
		const page = req.query.page
		Promise.all([
			populateQuery(req, Question.find({ owner: req.account.user }))
				.lean()
				.limit(pageSize)
				.skip(pageSize * (page - 1))
				.then(questions => {
					return Promise.all(
						_.map(questions, question => prepareToClient(req, question))
					)
				}),
			Question.find({ owner: req.account.user })
				.lean()
				.count()
		])
			.then(([questions, count]) => {
				res.sendSuccess({ questions, count })
			})
			.catch(err => {
				res.sendError(err)
			})
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
			.populate({ path: 'votes' })
			.select('+counters')
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
						question: q,
						code: req.body.code
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
			.populate({ path: 'tags' })
			.select('+counters')
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
						question: q,
						code: req.body.code
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
			.populate({ path: 'marks', options: { lean: true } })
			.select('+counters')
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
	},

	comment: (req, res) => {
		if (!req.body.text) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		Question.findById(req.params._id)
			.lean()
			.then(q => {
				if (!q) {
					return res.sendError(CONST.ERROR.WRONG_REQUEST)
				}
				return new Comment({
					owner: req.account.user,
					question: q,
					text: req.body.text,
					replyTo: req.body.replyTo
				}).save()
			})
			.then(([q, comment]) => {
				q.comments.push(comment)
				q.counters.comments = q.counters.comments + 1
				return q.save().then(() => {
					return comment
				})
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
