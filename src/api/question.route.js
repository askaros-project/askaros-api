import _ from 'lodash'
import CONST from '../const'
import Question from '../models/question.model'
import Activity from '../models/activity.model'
import Vote from '../models/vote.model'
import Tag from '../models/tag.model'
import Mark from '../models/mark.model'
import Comment from '../models/comment.model'
import { getList as getTrendingList } from '../services/trending_list'
import NotificationService from '../services/notifications'
import Promise from 'bluebird'
require('mongoose-query-random')

const prepareVotes = (detailed, question, userId) => {
	let items = question.votes
	question.votes = {
		total: question.votes.length,
		counts: {
			[CONST.VOTE.YES]: 0,
			[CONST.VOTE.NO]: 0
		},
		selected: undefined,
		items: detailed ? items : undefined
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

const prepareTags = (detailed, question, userId) => {
	if (!detailed) {
		delete question.tags
		return Promise.resolve(question)
	}
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

const prepareMarks = (detailed, question, userId) => {
	if (!detailed) {
		delete question.marks
		return Promise.resolve(question)
	}
	let items = question.marks
	question.marks = { items: [] }
	if (userId) {
		question.marks.items = _.filter(items, m => m.owner.equals(userId))
	}
	return Promise.resolve(question)
}

const prepareComments = (detailed, question, userId) => {
	if (!detailed) {
		delete question.comments
		return Promise.resolve(question)
	}
	question.comments = { total: question.comments.length }
	return Promise.resolve(question)
}

const prepareToClient = (req, question) => {
	const userId = req.account ? req.account.user : null
	const detailed = req.query.detailed
	return prepareVotes(detailed, question, userId)
		.then(() => {
			return prepareTags(detailed, question, userId)
		})
		.then(question => {
			return prepareMarks(detailed, question, userId)
		})
		.then(question => {
			return prepareComments(detailed, question, userId)
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
				if (req.account) {
					return NotificationService.markAsReceived({
						question: question,
						owner: req.account.user
					}).then(() => question)
				}
				return question
			})
			.then(question => {
				res.sendSuccess({ question })
				return question
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	getRandomQuestion: (req, res) => {
		Question.find()
			.select('uri')
			.lean()
			.then(questions => {
				let index = _.random(0, questions.length - 1)
				res.sendSuccess({ question: questions[index] })
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	getVotes: (req, res) => {
		return Vote.find({ question: req.params.id })
			.populate({ path: 'owner', options: { lean: true } })
			.lean()
			.then(votes => {
				res.sendSuccess({ votes })
			})
			.catch(err => {
				res.sendError(err)
			})
	},

	getAllCollection: (req, res) => {
		const limit = parseInt(req.query.limit) || 10000
		const offset = parseInt(req.query.offset) || 0
		populateQuery(req, Question.find())
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(offset)
			.lean()
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

	getNewestCollection: (req, res) => {
		const limit = parseInt(req.query.limit) || 5
		const offset = parseInt(req.query.offset) || 0
		populateQuery(req, Question.find())
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(offset)
			.lean()
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

	getRelatedCollection: (req, res) => {
		if (!req.query.qid) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		const limit = parseInt(req.query.limit) || 5
		Question.findById(req.query.qid)
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

	getTagCollection: (req, res) => {
		if (!req.query.code) {
			return res.sendError(CONST.ERROR.WRONG_REQUEST)
		}
		const limit = parseInt(req.query.limit) || 5
		const offset = parseInt(req.query.offset) || 0
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
			},
			{
				$skip: offset
			}
		])
			.then(result => {
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

	getTrendingCollection: (req, res) => {
		const limit = parseInt(req.query.limit) || 10
		const offset = parseInt(req.query.offset) || 0
		const trendingList = getTrendingList()
		const list = trendingList.slice(offset, offset + limit)

		return Question.find({
			_id: { $in: list }
		})
			.populate({ path: 'votes', options: { lean: true } })
			.lean()
			.then(questions => {
				return questions.sort((q1, q2) => {
					return (
						_.findIndex(list, id => id.equals(q1._id)) -
						_.findIndex(list, id => id.equals(q2._id))
					)
				})
			})
			.then(questions => {
				return Promise.all(_.map(questions, q => prepareToClient(req, q)))
			})
			.then(questions => {
				res.sendSuccess({ questions, total: trendingList.length })
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

	delete: (req, res) => {
		Question.deleteQuestion(req.params.id)
			.then(() => {
				res.sendSuccess()
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
				const voteIndex = _.findIndex(q.votes, a => {
					return a.owner.equals(req.account.user) && a.question.equals(q._id)
				})
				if (voteIndex !== -1) {
					if (q.votes[voteIndex].code === req.body.code) {
						const removedVotes = q.votes.splice(voteIndex, 1)
						q.counters.votes = q.counters.votes - 1
						return q.save().then(() => {
							return removedVotes[0].remove().then(v => {
								return Promise.resolve(q)
							})
						})
					} else {
						q.votes[voteIndex].code = req.body.code
						return q.votes[voteIndex].save().then(() => {
							return Promise.resolve(q)
						})
					}
				} else {
					return Promise.all([
						Promise.resolve(q),
						new Vote({
							owner: req.account.user,
							question: q,
							code: req.body.code
						}).save()
					]).then(([q, vote]) => {
						q.votes.push(vote)
						q.counters.votes = q.counters.votes + 1
						return q.save()
					})
				}
			})
			.then(q => {
				return Activity.push({
					type: CONST.ACTIVITY_TYPE.VOTE,
					owner: req.account.user,
					question: q,
					code: req.body.code
				})
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
				const tagIndex = _.findIndex(q.tags, a => {
					return a.owner.equals(req.account.user) && a.question.equals(q._id)
				})
				if (tagIndex !== -1) {
					if (q.tags[tagIndex].code === req.body.code) {
						const removedTags = q.tags.splice(tagIndex, 1)
						q.counters.tags = q.counters.tags - 1
						return q.save().then(() => {
							return removedTags[0].remove().then(() => {
								return Promise.resolve(q)
							})
						})
					} else {
						q.tags[tagIndex].code = req.body.code
						return q.tags[tagIndex].save().then(() => {
							return Promise.resolve(q)
						})
					}
				} else {
					return Promise.all([
						Promise.resolve(q),
						new Tag({
							owner: req.account.user,
							question: q,
							code: req.body.code
						}).save()
					]).then(([q, tag]) => {
						q.tags.push(tag)
						q.counters.tags = q.counters.tags + 1
						return q.save()
					})
				}
			})
			.then(q => {
				return Activity.push({
					type: CONST.ACTIVITY_TYPE.TAG,
					owner: req.account.user,
					question: q,
					code: req.body.code
				})
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
			.populate({ path: 'marks' })
			.select('+counters')
			.then(q => {
				if (!q) {
					return res.sendError(CONST.ERROR.WRONG_REQUEST)
				}
				const markIndex = _.findIndex(q.marks, m => {
					return m.owner.equals(req.account.user) && m.code === req.body.code
				})
				if (markIndex !== -1) {
					const removedMarks = q.marks.splice(markIndex, 1)
					return Promise.resolve()
						.then(() => {
							if (req.body.code === CONST.MARK.SPAM) {
								q.counters.spam_mark = q.counters.spam_mark - 1
								return q.save()
							}
						})
						.then(() => {
							return removedMarks[0].remove().then(() => {
								return Promise.resolve(q)
							})
						})
				} else {
					return Promise.all([
						Promise.resolve(q),
						new Mark({
							owner: req.account.user,
							question: q,
							code: req.body.code
						}).save()
					]).then(([q, mark]) => {
						q.marks.push(mark)
						if (req.body.code === CONST.MARK.SPAM) {
							q.counters.spam_mark = q.counters.spam_mark + 1
						}
						return q.save()
					})
				}
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
