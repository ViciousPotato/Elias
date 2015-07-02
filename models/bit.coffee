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
    if err
      return callback err, null
    normalizedBits = _.map bits, (bit) ->
      # TODO: create default topic when bit is created.
      if not bit.topics?.length
        bit.topics = [c.default_topic]
      return bit
    callback null, normalizedBits

bitSchema.statics.create = (topics, content, callback) ->
  async.each topics, (topic, cb) ->
    Article.createIfNotExists topic, '', cb
  , (error) ->
    if error
      return callback error, null
    bit = new Bit
      topics: topics
      content: content
    bit.save callback

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

bitSchema.statics.topics = (callback) ->
  this.allTopics (topics) ->
    # JS default sort order is asc
    _.map topics, (val, key) -> val.sort().reverse()
    sorted_topics = _.map topics, (val, key) ->
      if val
        return [key, val[0].date]
      else
        return [key, null]
    sorted_topics.sort (a, b) -> b[1]-a[1]
    callback null, sorted_topics

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

bitSchema.statics.changeTopicName = (oldTopic, newTopic, callback) ->
  if oldTopic == newTopic
    return callback null

  console.log 'changing from ', oldTopic, 'to', newTopic

  this.update {topics: oldTopic}, {$set : {"topics.$": newTopic}}, (error, raw) ->
    if error
      callback raw
    else
      callback null

Bit = mongoose.model 'Bit', bitSchema

module.exports = Bit
