import _ from 'lodash'
import CONST from '../const'
import Activity from '../models/activity.model'
import Vote from '../models/vote.model'
import Tag from '../models/tag.model'
import Mark from '../models/mark.model'
import Comment from '../models/comment.model'
import mongoose from 'mongoose'
import mongoose_delete from 'mongoose-delete'
mongoose.Promise = require('bluebird')

const Schema = mongoose.Schema

const countersSchema = new Schema(
	{
		votes: { type: Number, default: 0 },
		tags: { type: Number, default: 0 },
		spam_mark: { type: Number, default: 0 }
	},
	{ _id: false }
)

const questionSchema = new Schema(
	{
		owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		title: { type: String, required: true },
		uri: { type: String, required: true },
		keywords: { type: [String], default: [], index: true },
		votes: {
			type: [{ type: Schema.Types.ObjectId, ref: 'Vote' }],
			default: [],
			select: false
		},
		tags: {
			type: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
			default: [],
			select: false
		},
		marks: {
			type: [{ type: Schema.Types.ObjectId, ref: 'Mark' }],
			default: [],
			select: false
		},
		comments: {
			type: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
			default: [],
			select: false
		},
		counters: {
			type: countersSchema,
			select: false,
			default: { votes: 0, tags: 0, spam_mark: 0, comments: 0 }
		},
		createdAt: { type: Date, default: Date.now }
	},
	{
		usePushEach: true
	}
)

questionSchema.index({ title: 'text', keywords: 'text' })

questionSchema.statics.createQuestion = ({
	owner,
	title = '',
	keywords = []
}) => {
	// add "?" symbol
	title = _.trim(title)
	if (!/\?$/.test(title)) {
		title = title + '?'
	}

	return getUri(title).then(uri => {
		const question = new ModelClass({
			owner,
			title,
			uri,
			keywords
		})
		return question.save()
	})
}

questionSchema.statics.deleteQuestion = id => {
	return ModelClass.findById(id).then(question => {
		if (!question) {
			return Promise.reject('Not found')
		}
		return Activity.delete({ question})
			.then(() => {
				return Tag.delete({ question })
			})
			.then(() => {
				return Vote.delete({ question })
			})
			.then(() => {
				return Mark.delete({ question })
			})
			.then(() => {
				return Comment.delete({ question })
			})
			.then(() => {
				return question.delete()
			})
	})
}

function getUri(title) {
	let p = title.replace(/[^a-zA-Z0-9\s]/g, '')
	let uri = encodeURIComponent(p.replace(/\s+/g, '-'))
	return ModelClass.findOne({ uri }).then(model => {
		if (model) {
			return getUri(title + ' ' + _.random(0, 100))
		} else {
			return uri
		}
	})
}

questionSchema.plugin(mongoose_delete, {
	deletedAt: true,
	overrideMethods: true
})
const ModelClass = mongoose.model('Question', questionSchema)
export default ModelClass
