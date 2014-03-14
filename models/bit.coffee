_        = require 'underscore'
mongoose = require 'mongoose'

bitSchema = new mongoose.Schema
  content: String,
  topics:  [String],
  date: 
    type:    Date
    default: Date.now

bitSchema.statics.allTopics = (callback) ->
  this.find {}, (err, bits) ->
    callback _.chain(bits).map((bit) -> bit.topics).flatten().uniq().value()

Bit = mongoose.model 'Bit', bitSchema
module.exports = Bit
