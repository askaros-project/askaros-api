const log = require('../services/log')('mailcampaign.model')
import _ from 'lodash'
import CONST from '../const'
import mongoose from 'mongoose'
mongoose.Promise = require('bluebird')

const Schema = mongoose.Schema

const mailCampaignSchema = new Schema({
	title: { type: String, required: true },
	subject: { type: String, required: true },
	html_content: { type: String, required: true },
	lastSentAt: { type: Date, required: false },
	isTest: { type: Boolean, default: true },
	testTo: { type: Array, default: [] },
	isScheduled: { type: Boolean, default: false },
	eachDays: { type: Number },
	sendgridId: { type: Number },
	createdAt: { type: Date, default: Date.now }
})

const ModelClass = mongoose.model('MailCampaign', mailCampaignSchema)
export default ModelClass
