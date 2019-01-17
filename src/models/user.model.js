const log = require('../services/log')('user.model')
import _ from 'lodash'
import mongoose from 'mongoose'
import mongoose_delete from 'mongoose-delete'
mongoose.Promise = require('bluebird')

const Schema = mongoose.Schema

const userSchema = new Schema({
	username: { type: String, required: true },
	location: { type: String, required: false },
	descr: { type: String, required: false },
	birthyear: { type: Number },
	sex: { type: String, enum: ['Male', 'Female'] }
})

userSchema.plugin(mongoose_delete, { deletedAt: true, overrideMethods: true })
const ModelClass = mongoose.model('User', userSchema)
export default ModelClass
