import _ from 'lodash'
import CONST from '../const'
import mongoose from 'mongoose'
import mongoose_delete from 'mongoose-delete'
mongoose.Promise = require('bluebird')

const Schema = mongoose.Schema

const notificationSchema = new Schema({
	type: {
		type: String,
		enum: [
			CONST.NOTIF_TYPE.SOMEONE_COMMENT_YOUR_Q,
			CONST.NOTIF_TYPE.SOMEONE_COMMENT_SAME_Q
		]
	},
	owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
	status: {
		type: String,
		enum: [
			CONST.NOTIF_STATUS.NEW,
			CONST.NOTIF_STATUS.SENT,
			CONST.NOTIF_STATUS.RECEIVED,
			CONST.NOTIF_STATUS.FAILED,
			CONST.NOTIF_STATUS.NOT_ALLOWED
		],
		default: CONST.NOTIF_STATUS.NEW
	},
	attempts: { type: Number, default: 0 },
	attemptAt: { type: Date },
	createdAt: { type: Date, default: Date.now }
})
notificationSchema.plugin(mongoose_delete, {
	deletedAt: true,
	overrideMethods: true
})
const ModelClass = mongoose.model('Notification', notificationSchema)
export default ModelClass
