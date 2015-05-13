mongoose = require 'mongoose'

Bit      = require './bit'

topicSchema = new mongoose.Schema
  bits: [Bit]

module.exports = mongoose.model 'Topic', topicSchema