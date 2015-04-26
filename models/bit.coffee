_        = require 'underscore'
mongoose = require 'mongoose'
async    = require 'async'

util     = require '../util'
c        = require '../config'
Activity = require './activity'

bitSchema = new mongoose.Schema
  content: String,
  topics:  [String],
  date: 
    type:    Date
    default: Date.now

bitSchema.statics.bitsInTopic = (topic, callback) ->
  if topic == c.default_topic
    cond = {topics: []}
  else
    cond = {topics: {$elemMatch: {$eq: topic}}}

  this.find cond, null, {sort: {date: -1}}, (err, bits) ->
    normalizedBits = _.map bits, (bit) ->
      # TODO: create default topic when bit is created.
      if not bit.topics?.length
        bit.topics = [c.default_topic]
      return bit
    return callback normalizedBits

bitSchema.statics.allTopics = (callback) ->
  # Returns {'topic name': [bit, ...], ... }
  this.find {}, null, {sort: {date: -1}}, (err, bits) ->
    topics = {}
    _.map bits, (bit) ->
      if not bit.topics?.length
        bit.topics = [c.default_topic]
      _.map bit.topics, (topic) ->
        if topics[topic]
          topics[topic].push(bit)
        else
          topics[topic] = [bit]

    return callback topics

    topics = _.chain(bits).map((bit) -> bit.topics).flatten().uniq().value()
    # Get topic's activities
    async.map topics, (topic, cb) ->
      Activity.find topic: topic, (err, activities) ->
        cb null, topic: topic, activities: activities
    , (error, results) ->
      callback results

bitSchema.statics.bits = (offset, limit, render, callback) ->
  this.find({}, null, {sort: {date: -1}}).skip(offset).limit(limit).exec (err, bits) ->
    # Shorten bits text for display
    _.each bits, (bit) -> bit.content = render(util.shorten_bit(bit.content))
    callback err, bits

bitSchema.methods.render = (render) ->
  this.content = render(content)

bitSchema.statics.bits_since = (timestamp, callback) ->
  t = new Date(timestamp*1000).toISOString()
  this.find().where('date').gte(new Date(t)).exec callback

module.exports = mongoose.model 'Bit', bitSchema
