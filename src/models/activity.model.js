import _ from "lodash"
import CONST from "../const"
import mongoose from "mongoose"
import mongoose_delete from "mongoose-delete"
mongoose.Promise = require("bluebird")

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
			ACTIVITY_TYPE.OTHERS_VOTE_AS_WELL
		],
		required: true
	},
	owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
	question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
	code: { type: Number },
	unread: { type: Boolean, default: true },
	createdAt: { type: Date, default: Date.now }
})

activitySchema.statics.push = (
	{ type, owner, question, code },
	markAsRead = false
) => {
	const activity = new ModelClass({
		type,
		owner,
		question,
		code,
		unread: markAsRead ? false : true
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
						.select("owner")
				})
				.then(activities => {
					console.log(activities)
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
