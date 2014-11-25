mongoose = require "mongoose"

activitySchema = new mongoose.Schema
  topic: String
  action: String # Add, delete, update...
  detail: String
  bitId: mongoose.Schema.Types.ObjectId
  date:
    type: Date
    default: Date.now

module.exports = mongoose.model 'Activity', activitySchema