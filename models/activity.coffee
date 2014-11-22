mongoose = require "mongoose"

activitySchema = new mongoose.Schema
  action: String
  detail: String
  bitId: ObjectId
  date:
    type: Date
    default: Date.now

module.exports = mongoose.model 'Activity', activitySchema