import CONST from "../const"
import mongoose from "mongoose"
import mongoose_delete from "mongoose-delete"
mongoose.Promise = require("bluebird")

const Schema = mongoose.Schema
const { QUESTION_CREATED } = CONST.ACTIVITY_TYPE

const activitySchema = new Schema({
	type: { type: String, enum: [QUESTION_CREATED], required: true },
	owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
	question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
	unread: { type: Boolean, default: true },
	createdAt: { type: Date, default: Date.now }
})

activitySchema.statics.push = ({ type, owner, question }) => {
	const activity = new ModelClass({
		type,
		owner,
		question,
		unread: true
	})
	return activity.save()
}

activitySchema.plugin(mongoose_delete, {
	deletedAt: true,
	overrideMethods: true
})
const ModelClass = mongoose.model("Activity", activitySchema)
export default ModelClass
