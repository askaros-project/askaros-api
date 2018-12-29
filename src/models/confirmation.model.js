const log = require("../services/log")("confirmation.model")
import mongoose from "mongoose"
import mongoose_delete from "mongoose-delete"
mongoose.Promise = require("bluebird")

const Schema = mongoose.Schema

const confirmationSchema = new Schema({
	account: { type: Schema.Types.ObjectId, ref: "Account", required: true },
	email: { type: String }
})
confirmationSchema.plugin(mongoose_delete, {
	deletedAt: true,
	overrideMethods: true
})
const ModelClass = mongoose.model("Confirmation", confirmationSchema)
export default ModelClass
