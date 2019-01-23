const log = require('../services/log')('mailsender.model')
import _ from 'lodash'
import CONST from '../const'
import mongoose from 'mongoose'
mongoose.Promise = require('bluebird')

const Schema = mongoose.Schema

const mailSenderSchema = new Schema({
	sendgridId: { type: Number, required: true }
})

const ModelClass = mongoose.model('MailSender', mailSenderSchema)
export default ModelClass
