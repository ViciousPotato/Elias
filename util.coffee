_ = require 'underscore'

module.exports.parse_bit = (content) ->
  return null if not content
  lines = content.split '\n'
  last_line = _.last lines

  if last_line?.search(/^\s*\[.*\]+\s*$/) >= 0
    topics = _.map(last_line.match(/\[[^\]]*\]/g), (s) -> s.substr(1, s.length-2))
    content: lines[..-2].join '\n'
    topics: topics
  else
    content: content
    topics: []

module.exports.bit_summary = (content) ->
  return content if content.length <= 200
  return content[0..200-1] + content[200..].split('\n')[0]

module.exports.join_topics = (topics) ->
  ("[#{topic}]" for topic in topics).join('')