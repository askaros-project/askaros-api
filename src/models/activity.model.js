import CONST from "../const"
import mongoose from "mongoose"
import mongoose_delete from "mongoose-delete"
mongoose.Promise = require("bluebird")

const Schema = mongoose.Schema
const {
	QUESTION,
	VOTE,
	TAG,
	COMMENT,
	SOMEONE_VOTE,
	SOMEONE_TAG,
	SOMEONE_COMMENT,
	OTHERS_VOTE_AS_WELL
} = CONST.ACTIVITY_TYPE

const activitySchema = new Schema({
	type: {
		type: String,
		enum: [
			QUESTION,
			VOTE,
			TAG,
			COMMENT,
			SOMEONE_VOTE,
			SOMEONE_TAG,
			SOMEONE_COMMENT,
			OTHERS_VOTE_AS_WELL
		],
		required: true
	},
	owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
	question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
	unread: { type: Boolean, default: true },
	createdAt: { type: Date, default: Date.now }
})

activitySchema.statics.push = (
	{ type, owner, question },
	markAsRead = false
) => {
	const activity = new ModelClass({
		type,
		owner,
		question,
		unread: markAsRead ? false : true
	})
	return activity.save().then(activity => {
		if (type === TAG && !question.owner.equals(owner)) {
			return new ModelClass({
				type: SOMEONE_TAG,
				owner: question.owner,
				question: question
			}).save()
		} else if (type === VOTE && !question.owner.equals(owner)) {
			return new ModelClass({
				type: SOMEONE_VOTE,
				owner: question.owner,
				question: question
			}).save()
		}
		return Promise.resolve()
	})
}

activitySchema.plugin(mongoose_delete, {
	deletedAt: true,
	overrideMethods: true
})
const ModelClass = mongoose.model("Activity", activitySchema)
export default ModelClass
