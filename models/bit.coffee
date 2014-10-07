_        = require 'underscore'
mongoose = require 'mongoose'
util     = require '../util'

bitSchema = new mongoose.Schema
  content: String,
  topics:  [String],
  date: 
    type:    Date
    default: Date.now

bitSchema.statics.allTopics = (callback) ->
  this.find {}, (err, bits) ->
    callback _.chain(bits).map((bit) -> bit.topics).flatten().uniq().value()

bitSchema.statics.bits = (offset, limit, callback) ->
  this.find({}).skip(offset * limit).limit(limit).exec (err, bits) ->
    callback err, bits

Bit = mongoose.model 'Bit', bitSchema
module.exports = Bit
