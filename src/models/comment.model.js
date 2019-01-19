import _ from 'lodash'
import CONST from '../const'
import mongoose from 'mongoose'
import mongoose_delete from 'mongoose-delete'
mongoose.Promise = require('bluebird')

const Schema = mongoose.Schema

const countersSchema = new Schema(
	{
		spam_mark: { type: Number, default: 0 },
		like_mark: { type: Number, default: 0 }
	},
	{ _id: false }
)

const commentSchema = new Schema(
	{
		owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
		text: { type: String, required: true },
		replyTo: { type: Schema.Types.ObjectId, ref: 'Comment' },
		marks: {
			type: [{ type: Schema.Types.ObjectId, ref: 'Mark' }],
			default: [],
			select: false
		},
		counters: {
			type: countersSchema,
			select: false,
			default: { spam_mark: 0, like_mark: 0 }
		},
		createdAt: { type: Date, default: Date.now }
	},
	{
		usePushEach: true
	}
)
commentSchema.plugin(mongoose_delete, {
	deletedAt: true,
	overrideMethods: true
})
const ModelClass = mongoose.model('Comment', commentSchema)
export default ModelClass
