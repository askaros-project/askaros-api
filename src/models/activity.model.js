import CONST from "../const"
import mongoose from "mongoose"
import mongoose_delete from "mongoose-delete"
mongoose.Promise = require("bluebird")

const Schema = mongoose.Schema
const {
	QUESTION,
	ANSWER,
	TAG,
	COMMENT,
	SOMEONE_ANSWER,
	SOMEONE_TAG,
	SOMEONE_COMMENT,
	OTHERS_ANSWER_AS_WELL
} = CONST.ACTIVITY_TYPE

const activitySchema = new Schema({
	type: {
		type: String,
		enum: [
			QUESTION,
			ANSWER,
			TAG,
			COMMENT,
			SOMEONE_ANSWER,
			SOMEONE_TAG,
			SOMEONE_COMMENT,
			OTHERS_ANSWER_AS_WELL
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
		} else if (type === ANSWER && !question.owner.equals(owner)) {
			return new ModelClass({
				type: SOMEONE_ANSWER,
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
