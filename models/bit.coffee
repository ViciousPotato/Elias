mongoose = require 'mongoose'

bitSchema = new mongoose.Schema
  title:   String
  content: String,
  date: 
    type:    Date
    default: Date.now

Bit = mongoose.model 'Bit', bitSchema
module.exports = Bit