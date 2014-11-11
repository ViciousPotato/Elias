chai = require 'chai'
util = require '../util'

chai.should()
assert = chai.assert

describe 'Util', ()->
  describe '#parse_bit', ()->
    it 'should return null if content is undefined', ()->
      assert.equal null, util.parse_bit undefined

    it 'should return {} if content is null', () ->
      assert.equal null, util.parse_bit null

    it 'should return topic for one line topic', () ->
      bit = '[Book]'
      {topics: ['Book'], content: ''}.should.eql util.parse_bit bit

    it 'should return topic for one line topic with empty preceding lines', () ->
      bit = '    \n    \n [Book]'
      {topics: ['Book'], content: '    \n    '}.should.eql util.parse_bit bit

    it 'should return topic and content', () ->
      bit = 'Unix\n[Book]'
      {topics: ['Book'], content: 'Unix'}.should.eql util.parse_bit bit

    it 'should return content', () ->
      bit = 'Unix\nLinux'
      {topics: [], content: bit}.should.eql util.parse_bit bit
      
    it 'should be able to process Chinese character', () ->
      bit = '[中文]'
      {topics: ['中文'], content: ""}.should.eql util.parse_bit bit

    it 'should be able to parse multiple topics', () ->
      bit = '[Topic1][Topic2]'
      {topics: ['Topic1', 'Topic2'], content: ""}.should.eql util.parse_bit bit

    it 'should should not parse [] in normal text', () ->
      bit = 'abc[Topic][Topic]'
      {topics: [], content: bit}.should.eql util.parse_bit bit

  describe '#bit_summary', ()->
    it 'should parse short content well', ()->
      bit = 'This is short content'
      bit.should.eql util.bit_summary bit

    it 'should cut bit at end of line', ()->
      bit = Array(201).join 'a'
      (bit+'abc').should.eql util.bit_summary bit+'abc\ndef'

  describe '#join_topics', ()->
    it 'should join topics', ()->
      '[Topic][Topic]'.should.eql util.join_topics ['Topic', 'Topic']

  describe '#shorten_text', ()->
    it 'should shorten <= 3', ()->
      '...'.should.eql util.shorten_text 'slice', 2
      '...'.should.eql util.shorten_text 'slice', 0
      '...'.should.eql util.shorten_text 'slice', 3

    it 'should shorten > 3', ()->
      's...'.should.eql util.shorten_text 'slice', 4
      'slice'.should.eql util.shorten_text 'slice', 5
      'slice'.should.eql util.shorten_text 'slice', 6
      'My ...ove'.should.eql util.shorten_text 'My dear love', 9

  describe "#shorten_bits", ()->
    it 'should shorten long lines', ()->
      'abc\ndef\n...'.should.eql util.shorten_bit 'abc\ndef\nghi', 3, 2

    it 'should not shorten short lines', () ->
      'ab\nc'.should.eql util.shorten_bit('ab\nc', 3, 2)



