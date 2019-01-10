import _ from "lodash"
import CONST from "../const"
import mongoose from "mongoose"
import mongoose_delete from "mongoose-delete"
mongoose.Promise = require("bluebird")

const Schema = mongoose.Schema

const commentSchema = new Schema({
	owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
	question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
	text: { type: String, required: true },
	replyTo: { type: Schema.Types.ObjectId, ref: "Comment" },
	// code: {
	// 	type: Number,
	// 	enum: [CONST.MARK.SPAM],
	// 	required: true
	// },
	createdAt: { type: Date, default: Date.now }
})
commentSchema.plugin(mongoose_delete, {
	deletedAt: true,
	overrideMethods: true
})
const ModelClass = mongoose.model("Comment", commentSchema)
export default ModelClass
