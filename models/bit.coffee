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

bitSchema.statics.bits = (offset, limit, render, callback) ->
  this.find({}, null, {sort: {date: -1}}).skip(offset).limit(limit).exec (err, bits) ->
    _.each bits, (bit) -> bit.content = render(util.shorten_bit(bit.content))
    callback err, bits

bitSchema.methods.render = (render) ->
  this.content = render(content)

Bit = mongoose.model 'Bit', bitSchema
module.exports = Bit
