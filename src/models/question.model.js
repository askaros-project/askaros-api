import _ from "lodash"
import CONST from "../const"
import mongoose from "mongoose"
import mongoose_delete from "mongoose-delete"
mongoose.Promise = require("bluebird")

const Schema = mongoose.Schema

const questionSchema = new Schema({
	owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
	title: { type: String, required: true },
	uri: { type: String, required: true },
	keywords: { type: [String], default: [], index: true },
	answers: {
		type: [{ type: Schema.Types.ObjectId, ref: "Answer" }],
		default: [],
		select: false
	},
	createdAt: { type: Date, default: Date.now }
})

questionSchema.statics.createQuestion = ({
	owner,
	title = "",
	keywords = []
}) => {
	// add "?" symbol
	title = _.trim(title)
	if (!/\?$/.test(title)) {
		title = title + "?"
	}

	return getUri(title).then(uri => {
		const activity = new ModelClass({
			owner,
			title,
			uri,
			keywords
		})
		return activity.save()
	})
}

function getUri(title) {
	let p = title.replace(/[^a-zA-Z0-9\s]/g, "")
	let uri = encodeURIComponent(p.replace(/\s+/g, "-"))
	return ModelClass.findOne({ uri }).then(model => {
		if (model) {
			return getUri(title + " " + _.random(0, 100))
		} else {
			return uri
		}
	})
}

questionSchema.plugin(mongoose_delete, {
	deletedAt: true,
	overrideMethods: true
})
const ModelClass = mongoose.model("Question", questionSchema)
export default ModelClass
