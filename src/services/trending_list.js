import _ from 'lodash'
import moment from 'moment'
import Activity from '../models/activity.model'
import Question from '../models/question.model'
import CONST from '../const'
import mongoose from 'mongoose'
import Promise from 'bluebird'

let list = []

const updateList = () => {
	return Activity.aggregate([
		{
			$match: {
				type: {
					$in: [
						CONST.ACTIVITY_TYPE.TAG,
						CONST.ACTIVITY_TYPE.VOTE,
						CONST.ACTIVITY_TYPE.COMMENT
					]
				}
			}
		},
		{
			$group: { _id: '$question', count: { $sum: 1 } }
		},
		{
			$sort: {
				count: -1
			}
		}
	]).then(result => {
		list = _.map(_.filter(result, item => item.count > 0), '_id')
	})
}

updateList() // initial upd

const period = parseInt(process.env.TRENDING_LIST_UPD_PERIOD_IN_MIN) || 1
setInterval(updateList, period * 60 * 1000) // upd every x mins

export const getList = () => list
