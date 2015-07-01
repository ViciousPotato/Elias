mongoose = require 'mongoose'
_        = require 'underscore'
Bit      = require './bit'
util     = require '../util'

articleSchema = new mongoose.Schema
  topic: String
  content: String
  bits: []
  created: 
    type:    Date
    default: Date.now
  updated:
    type:    Date
    default: Date.now

articleSchema.statics.createIfNotExists = (name, content, cb) ->
  article = new Article
    topic:   name
    content: content

  article.save cb

articleSchema.statics.get = (topic, cb) ->
    Bit.bitsInTopic topic, (error, bits) ->
      if error
        return cb error

      Article.findOne topic: topic, (error, article) ->
        if error or not article
          # If we don't have existing article, create one.
          contents = _.map bits, (bit) -> bit.content
          article = new Article
            content: contents.join('\n\n')
            topic: topic
          article.save (error, article) ->
            if error
              return cb error
            
            article.bits = bits
            cb null, article
        else
          article.bits = bits
          cb null, article

articleSchema.statics.topics = (callback) ->
  Article.find {}, (error, articles) ->
    if error
      return callback error, null
    topics = _.map articles, (article) -> [article.topic, article.updated]
    callback null, topics

Article = mongoose.model 'Article', articleSchema

module.exports = Article