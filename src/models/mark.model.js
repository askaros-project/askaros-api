import _ from 'lodash'
import CONST from '../const'
import mongoose from 'mongoose'
import mongoose_delete from 'mongoose-delete'
mongoose.Promise = require('bluebird')

const Schema = mongoose.Schema

const markSchema = new Schema({
	owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	question: { type: Schema.Types.ObjectId, ref: 'Question' },
	comment: { type: Schema.Types.ObjectId, ref: 'Comment' },
	code: {
		type: Number,
		enum: [CONST.MARK.SPAM, CONST.MARK.LIKE, CONST.MARK.BLOCK_NOTIF],
		required: true
	},
	createdAt: { type: Date, default: Date.now }
})
markSchema.plugin(mongoose_delete, {
	deletedAt: true,
	overrideMethods: true
})
const ModelClass = mongoose.model('Mark', markSchema)
export default ModelClass
