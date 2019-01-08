import _ from "lodash"
import CONST from "../const"
import mongoose from "mongoose"
import mongoose_delete from "mongoose-delete"
mongoose.Promise = require("bluebird")

const Schema = mongoose.Schema

const voteSchema = new Schema({
	owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
	question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
	code: {
		type: Number,
		enum: [CONST.VOTE.YES, CONST.VOTE.NO],
		required: true
	},
	createdAt: { type: Date, default: Date.now }
})

voteSchema.plugin(mongoose_delete, {
	deletedAt: true,
	overrideMethods: true
})
const ModelClass = mongoose.model("Vote", voteSchema)
export default ModelClass
