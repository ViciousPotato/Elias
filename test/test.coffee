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
      topics: ['中文'] .should.eql util.parse_bit bit
