import _ from "lodash"
import CONST from "../const"
import mongoose from "mongoose"
import mongoose_delete from "mongoose-delete"
mongoose.Promise = require("bluebird")

const Schema = mongoose.Schema

const rtagSchema = new Schema({
	owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
	question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
	code: {
		type: Number,
		enum: [
			CONST.RTAG.UNEXPECTED,
			CONST.RTAG.CHANGE_IN_FUTURE,
			CONST.RTAG.UNFAIR,
			CONST.RTAG.NOT_WHOLE,
			CONST.RTAG.PRETTY_MUCH_TRUE,
			CONST.RTAG.WEIRD,
			CONST.RTAG.EXPECTED
		],
		required: true
	},
	createdAt: { type: Date, default: Date.now }
})

rtagSchema.plugin(mongoose_delete, {
	deletedAt: true,
	overrideMethods: true
})
const ModelClass = mongoose.model("Rtag", rtagSchema)
export default ModelClass
