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

    it 'should return topic for basic topic', () ->
      bit = '[Book]'
      {'topics': ['Book']}.should.eql util.parse_bit bit