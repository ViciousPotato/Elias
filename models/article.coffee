mongoose = require 'mongoose'
_        = require 'underscore'
Bit      = require './bit'

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

articleSchema.statics.get = (name, cb) ->
  Article.findOne topic: name, (error, article) ->
    if error
      return cb error, null
    Bit.bitsInTopic name, (error, bits) ->
      if error
        return cb error
      article.bits = bits
      cb null, article

Article = mongoose.model 'Article', articleSchema

module.exports = Article