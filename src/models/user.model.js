const log = require('../services/log')('user.model')
import _ from 'lodash'
import CONST from '../const'
import mongoose from 'mongoose'
import mongoose_delete from 'mongoose-delete'
mongoose.Promise = require('bluebird')

const Schema = mongoose.Schema

const userSchema = new Schema({
	username: { type: String, required: true },
	email: { type: String, required: false },
	descr: { type: String, required: false },
	place: { type: Object, required: false },
	birthyear: { type: Number },
	sex: { type: String, enum: [CONST.SEX.MALE, CONST.SEX.FEMALE] },
	education: {
		type: String,
		enum: [
			CONST.EDUCATION_LEVEL.PRIMARY_SCHOOL,
			CONST.EDUCATION_LEVEL.SECONDARY_SCHOOL,
			CONST.EDUCATION_LEVEL.SPECIALIST,
			CONST.EDUCATION_LEVEL.BACHELOR,
			CONST.EDUCATION_LEVEL.MASTER,
			CONST.EDUCATION_LEVEL.DOCTORATE
		]
	},
	income: {
		type: String,
		enum: [
			CONST.INCOME_LEVEL.MIN,
			CONST.INCOME_LEVEL.MIDDLE,
			CONST.INCOME_LEVEL.MAX
		]
	}
})

userSchema.plugin(mongoose_delete, { deletedAt: true, overrideMethods: true })
const ModelClass = mongoose.model('User', userSchema)
export default ModelClass
