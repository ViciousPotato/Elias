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
          # If we don't have existing article, create a fake one.
          # TODO: maybe we should create one immediately.
          article = content: '', bits: bits, topic: topic, created: Date(), updated: Date()
          cb null, article
        else
          console.log error, article
          article.bits = bits
          cb null, article

Article = mongoose.model 'Article', articleSchema

module.exports = Article