_ = require 'underscore'

module.exports.parse_bit = (content) ->
  return null if not content
  lines = content.split '\n'
  last_line = _.last lines

  if last_line and last_line.search(/\[.*\]+/) >= 0
    topics: ['Book']