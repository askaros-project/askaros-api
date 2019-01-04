import mongoose from "mongoose"
import mongoose_delete from "mongoose-delete"
mongoose.Promise = require("bluebird")

const Schema = mongoose.Schema

const questionSchema = new Schema({
	owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
	title: { type: String, required: true },
	keywords: { type: [String], default: [], index: true },
	createdAt: { type: Date, default: Date.now }
})
questionSchema.plugin(mongoose_delete, {
	deletedAt: true,
	overrideMethods: true
})
const ModelClass = mongoose.model("Question", questionSchema)
export default ModelClass
