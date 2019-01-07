import _ from "lodash"
import CONST from "../const"
import mongoose from "mongoose"
import mongoose_delete from "mongoose-delete"
mongoose.Promise = require("bluebird")

const Schema = mongoose.Schema

const tagSchema = new Schema({
	owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
	question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
	code: {
		type: Number,
		enum: [
			CONST.TAG.UNEXPECTED,
			CONST.TAG.CHANGE_IN_FUTURE,
			CONST.TAG.UNFAIR,
			CONST.TAG.NOT_WHOLE,
			CONST.TAG.PRETTY_MUCH_TRUE,
			CONST.TAG.WEIRD,
			CONST.TAG.EXPECTED
		],
		required: true
	},
	createdAt: { type: Date, default: Date.now }
})

tagSchema.plugin(mongoose_delete, {
	deletedAt: true,
	overrideMethods: true
})
const ModelClass = mongoose.model("Tag", tagSchema)
export default ModelClass
