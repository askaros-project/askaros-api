const log = require('../services/log')('maillist.model')
import _ from 'lodash'
import CONST from '../const'
import mongoose from 'mongoose'
mongoose.Promise = require('bluebird')

const Schema = mongoose.Schema

const mailListSchema = new Schema({
	type: {
		type: String,
		enum: [CONST.MAIL_LIST.SUBSCRIBERS, CONST.MAIL_LIST.USERS],
		required: true
	},
	sendgridId: { type: Number, required: true }
})

const ModelClass = mongoose.model('MailList', mailListSchema)
export default ModelClass
