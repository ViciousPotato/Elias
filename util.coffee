_ = require 'underscore'

module.exports.parse_bit = (content) ->
  return null if not content
  lines = content.split '\n'
  last_line = _.last lines

  if last_line?.search(/\[.*\]+/) >= 0
    topics = _.map(last_line.match(/\[[^\]]*\]/g), (s) -> s.substr(1, s.length-2))
    content: lines[..-2].join '\n'
    topics: topics
  else
    content: content
    topics: []