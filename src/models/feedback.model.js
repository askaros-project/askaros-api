const log = require('../services/log')('feedback.model')
import _ from 'lodash'
import mongoose from 'mongoose'
mongoose.Promise = require('bluebird')

const Schema = mongoose.Schema

const feedbackSchema = new Schema({
	name: { type: String, required: true },
	email: { type: String, required: true },
	message: { type: String, required: true },
	createdAt: { type: Date, default: Date.now }
})

const ModelClass = mongoose.model('Feedback', feedbackSchema)
export default ModelClass
