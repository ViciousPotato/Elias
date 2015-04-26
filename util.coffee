_    = require 'underscore'
temp = require 'temp'
pdc  = require 'pdc'


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

module.exports.shorten_text = (text, len) ->
  switch
    when len >= text.length then text
    when len <= 3 then '...'
    else
      left = Math.ceil (len-3) / 2
      right = len-3-left
      text[0...left] + '...' + text[text.length-right...text.length]

module.exports.shorten_bit = (chars, line_length=35, disp_lines=20) ->
  showingLines = 0
  lines = chars.split("\n")
  res = []

  for line in lines
    showingLines += Math.ceil(line.length / line_length)
    if showingLines > disp_lines
      res.push("...")
      break
    else
      res.push(line)

  return res.join("\n")

module.exports.beautify_md = (s) ->
  # TODO: only replace specific location's character.
  # e.g. only replaces # at start of string.
  replace_s =
    "```" : ""
    "####": ""
    "###" : ""
    "##"  : ""
    "#"   : ""
    "^>"  : ""
    "!\\[(.+?)\\]\\(.+?\\)" : "$1"

  for r, replace of replace_s
    s = s.replace new RegExp(r, "g"), replace

  return s

module.exports.bits_to_pdf = (bits, callback) ->
  temp.open {"prefix": 'elias_gen_pdf_', "suffix": ".pdf"}, (error, info) ->
    contents = _.map bits, (bit) -> bit.content
    md = contents.join "\n"
    console.log md
    pdc md, 'markdown', 'latex', "-o#{info.path}", (error, result) ->
      callback(error, info.path)


