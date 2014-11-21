mongoose = require "mongoose"

activitySchema = new mongoose.Schema
  content: String
  date:
    type: Date
    default: Date.now

Activity = mongoose.model 'Activity', activitySchema
module.exports = Activity