import _ from 'lodash'
import CONST from '../const'
import mongoose from 'mongoose'
import mongoose_delete from 'mongoose-delete'
mongoose.Promise = require('bluebird')

const Schema = mongoose.Schema

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
