mongoose = require 'mongoose'

bitSchema = new mongoose.Schema
  content: String,
  topics:  [String],
  date: 
    type:    Date
    default: Date.now

Bit = mongoose.model 'Bit', bitSchema
module.exports = Bit