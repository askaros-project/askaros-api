import _ from 'lodash'
import CONST from '../const'
import Comment from './comment.model'
import mongoose from 'mongoose'
import mongoose_delete from 'mongoose-delete'
mongoose.Promise = require('bluebird')

const { ACTIVITY_TYPE } = CONST

const Schema = mongoose.Schema
const activitySchema = new Schema({
	type: {
		type: String,
		enum: [
			ACTIVITY_TYPE.QUESTION,
			ACTIVITY_TYPE.VOTE,
			ACTIVITY_TYPE.TAG,
			ACTIVITY_TYPE.COMMENT,
			ACTIVITY_TYPE.SOMEONE_VOTE,
			ACTIVITY_TYPE.SOMEONE_TAG,
			ACTIVITY_TYPE.SOMEONE_COMMENT,
			ACTIVITY_TYPE.SOMEONE_REPLY,
			ACTIVITY_TYPE.OTHERS_VOTE_AS_WELL
		],
		required: true
	},
	owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
	code: { type: Number },
	unread: { type: Boolean, default: true },
	createdAt: { type: Date, default: Date.now }
})

activitySchema.statics.push = ({
	type,
	owner,
	question,
	code,
	options = {}
}) => {
	let unread = true,
		onlyOne = false
	if (
		type === ACTIVITY_TYPE.QUESTION ||
		type === ACTIVITY_TYPE.TAG ||
		type === ACTIVITY_TYPE.VOTE
	) {
		unread = false
		onlyOne = true
	} else if (type === ACTIVITY_TYPE.COMMENT) {
		unread = false
	}

	return Promise.resolve()
		.then(() => {
			if (onlyOne) {
				return ModelClass.findOne({ type, owner, question: question._id })
					.lean()
					.then(existsModel => {
						return Promise.resolve(existsModel ? false : true)
					})
			} else {
				return Promise.resolve(true)
			}
		})
		.then(allowed => {
			if (!allowed) {
				return Promise.resolve()
			}
			const activity = new ModelClass({
				type,
				owner,
				question,
				code,
				unread
			})
			return activity.save().then(activity => {
				if (type === ACTIVITY_TYPE.TAG && !question.owner.equals(owner)) {
					return new ModelClass({
						type: ACTIVITY_TYPE.SOMEONE_TAG,
						owner: question.owner,
						question: question
					}).save()
				} else if (type === ACTIVITY_TYPE.VOTE) {
					return Promise.resolve()
						.then(() => {
							if (!question.owner.equals(owner)) {
								return new ModelClass({
									type: ACTIVITY_TYPE.SOMEONE_VOTE,
									owner: question.owner,
									question: question
								}).save()
							} else {
								return Promise.resolve()
							}
						})
						.then(() => {
							return ModelClass.find({
								type: ACTIVITY_TYPE.VOTE,
								code: code,
								question: question._id,
								owner: { $ne: owner }
							})
								.lean()
								.select('owner')
						})
						.then(activities => {
							return Promise.all(
								_.map(activities, a => {
									return new ModelClass({
										type: ACTIVITY_TYPE.OTHERS_VOTE_AS_WELL,
										owner: a.owner,
										question: question
									}).save()
								})
							)
						})
				} else if (type === ACTIVITY_TYPE.COMMENT) {
					return Promise.resolve()
						.then(() => {
							if (!question.owner.equals(owner)) {
								return new ModelClass({
									type: ACTIVITY_TYPE.SOMEONE_COMMENT,
									owner: question.owner,
									question: question
								}).save()
							} else {
								return Promise.resolve()
							}
						})
						.then(() => {
							if (options.replyTo) {
								return Comment.findById(options.replyTo)
									.lean()
									.then(comment => {
										if (!comment || comment.owner.equals(owner)) {
											return Promise.resolve()
										}
										return new ModelClass({
											type: ACTIVITY_TYPE.SOMEONE_REPLY,
											owner: comment.owner,
											question: question
										}).save()
									})
							}
						})
				} else {
					return Promise.resolve()
				}
			})
		})
}

activitySchema.plugin(mongoose_delete, {
	deletedAt: true,
	overrideMethods: true
})
const ModelClass = mongoose.model('Activity', activitySchema)
export default ModelClass
