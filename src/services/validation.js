/**

  Validation service

  Based on https://github.com/flatiron/revalidator

  Additional types:
    "name" - only characters
    "location" - array of numbers [<longitude>, <latitude>]

  Additional rules:
    "unique" - unique value for this field
    "trim" - trim value by _.trim
    "sanitize" - sanitize html

**/
import Promise from 'bluebird'
import * as _ from 'lodash'
import CONST from '../const'
const sanitizeHtml = require('sanitize-html')
const revalidator = require('revalidator')

export const validate = (data, contract, /** required for "unique" rule  */ ModelClass) => {
  return Promise.resolve()
    .then(() => {
      const uniqueProps = []

      _.each(contract, (prop, key) => {
        if (prop.type == 'name') {
          prop.type = 'string'
          prop.pattern = /^[a-zA-Z_\-\s]*$/
          prop.message = 'only characters are allowed'
        }
        if (prop.type == 'location') {
          prop.type = 'array'
          prop.conform = (v) => {
            if (_.isArray(v)) {
              if (v.length == 2) {
                if (typeof v[0] === 'number' && Math.abs(v[0]) <= 180 && typeof v[1] === 'number' && Math.abs(v[1]) <= 90) {
                  return true
                }
              }
              if (v.length == 0) {
                return true
              }
            }
            return false
          }
          prop.message = 'is invalid location value'
        }
        if (prop.trim) {
          data[key] = _.trim(data[key])
        }
        if (prop.sanitize && data[key]) {
          data[key] = sanitizeHtml(data[key])
        }
        if (prop.unique) {
          uniqueProps.push(key)
        }
      })

      const result = revalidator.validate(data, {properties: contract})

      if (result.valid) {
        if (uniqueProps.length) {
          return checkUniq(data, uniqueProps, ModelClass)
        }
        return data
      }
      return Promise.reject({
        message: CONST.ERROR.VALIDATION_ERROR,
        details: '<' + result.errors[0].property + '> ' + result.errors[0].message
      })
    })
    .then(() => {
      // essential for mongo middleware retrun nothing, overwise error
      return null
    })
}

function checkUniq (data, uniqueProps, ModelClass) {
  return Promise.map(uniqueProps, (prop) => {
    let query = {[prop]: data[prop]}
    if (data._id) {
      query._id = { $ne: data._id }
    }
    return ModelClass.findOne(query).lean()
  }).then((results) => { // this is an array of founded objects
    let valid = _.every(results, _.isEmpty)
    if (valid) {
      return data
    }
    return Promise.reject({
      message: CONST.ERROR.VALIDATION_ERROR,
      details: '<' + uniqueProps[_.findIndex(results, (r) => !_.isEmpty(r)) ] + '> must be unique'
    })
  })
}

export const bindValidator = (schema, contract, getModelClass) => {
  function onUpdate (next) {
    let data = this.getUpdate()
    if (this._conditions && this._conditions._id) {
      data._id = this._conditions._id
    }
    validate(data, _.pick(contract, _.keys(data)), getModelClass())
      .then(next)
      .catch(next)
  }

  schema.pre('validate', function (next) {
    validate(this, contract, getModelClass())
      .then(next)
      .catch(next)
  })
  schema.pre('update', onUpdate)
  schema.pre('findOneAndUpdate', onUpdate)
}

export default {
  validate,
  bindValidator,
  checkUniq,
}
