_ = require 'underscore'

module.exports.parse_bit = (content) ->
  return null if not content
  lines = content.split '\n'
  last_line = _.last lines

  if last_line and last_line.search(/\[.*\]+/) >= 0
    topic = last_line.match(/\[(.*)\]+/)[1]
    content: lines[..-2].join '\n'
    topics: [topic]
  else
    content: content
    topics: []