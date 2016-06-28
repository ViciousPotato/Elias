// Generated by CoffeeScript 1.10.0
(function() {
  var Activity, Bit, _, async, bitSchema, c, mongoose, util;

  _ = require('underscore');

  mongoose = require('mongoose');

  async = require('async');

  util = require('../util');

  c = require('../config');

  Activity = require('./activity');

  bitSchema = new mongoose.Schema({
    content: String,
    topics: [String],
    date: {
      type: Date,
      "default": Date.now
    }
  });

  bitSchema.statics.bitsInTopic = function(topic, callback) {
    var cond;
    if (topic === c.default_topic) {
      cond = {
        topics: []
      };
    } else {
      cond = {
        topics: {
          $elemMatch: {
            $eq: topic
          }
        }
      };
    }
    return this.find(cond, null, {
      sort: {
        date: -1
      }
    }, function(err, bits) {
      var normalizedBits;
      if (err) {
        return callback(err, null);
      }
      normalizedBits = _.map(bits, function(bit) {
        var ref;
        if (!((ref = bit.topics) != null ? ref.length : void 0)) {
          bit.topics = [c.default_topic];
        }
        return bit;
      });
      return callback(null, normalizedBits);
    });
  };

  bitSchema.statics.create = function(topics, content, callback) {
    console.log("topics: ", topics);
    return async.each(topics, function(topic, cb) {
      return Article.createIfNotExists(topic, '', cb);
    }, function(error) {
      var bit;
      if (error) {
        return callback(error, null);
      }
      bit = new Bit({
        topics: topics,
        content: content
      });
      return bit.save(callback);
    });
  };

  bitSchema.statics.allTopics = function(callback) {
    return this.find({}, null, {
      sort: {
        date: -1
      }
    }, function(err, bits) {
      var topics;
      topics = {};
      _.map(bits, function(bit) {
        var ref;
        if (!((ref = bit.topics) != null ? ref.length : void 0)) {
          bit.topics = [c.default_topic];
        }
        return _.map(bit.topics, function(topic) {
          if (topics[topic]) {
            return topics[topic].push(bit);
          } else {
            return topics[topic] = [bit];
          }
        });
      });
      return callback(topics);
      topics = _.chain(bits).map(function(bit) {
        return bit.topics;
      }).flatten().uniq().value();
      return async.map(topics, function(topic, cb) {
        return Activity.find({
          topic: topic
        }, function(err, activities) {
          return cb(null, {
            topic: topic,
            activities: activities
          });
        });
      }, function(error, results) {
        return callback(results);
      });
    });
  };

  bitSchema.statics.topics = function(callback) {
    return this.allTopics(function(topics) {
      var sorted_topics;
      _.map(topics, function(val, key) {
        return val.sort().reverse();
      });
      sorted_topics = _.map(topics, function(val, key) {
        if (val) {
          return [key, val[0].date];
        } else {
          return [key, null];
        }
      });
      sorted_topics.sort(function(a, b) {
        return b[1] - a[1];
      });
      return callback(null, sorted_topics);
    });
  };

  bitSchema.statics.bits = function(offset, limit, render, callback) {
    return this.find({}, null, {
      sort: {
        date: -1
      }
    }).skip(offset).limit(limit).exec(function(err, bits) {
      _.each(bits, function(bit) {
        return bit.content = render(util.shorten_bit(bit.content));
      });
      return callback(err, bits);
    });
  };

  bitSchema.methods.render = function(render) {
    return this.content = render(content);
  };

  bitSchema.statics.bits_since = function(timestamp, callback) {
    var t;
    t = new Date(timestamp * 1000).toISOString();
    return this.find().where('date').gte(new Date(t)).exec(callback);
  };

  bitSchema.statics.changeTopicName = function(oldTopic, newTopic, callback) {
    if (oldTopic === newTopic) {
      return callback(null);
    }
    console.log('changing from ', oldTopic, 'to', newTopic);
    return Bit.update({
      topics: oldTopic
    }, {
      $set: {
        "topics.$": newTopic
      }
    }, {
      multi: true
    }, function(error, raw) {
      if (error) {
        return callback(raw);
      } else {
        return callback(null);
      }
    });
  };

  Bit = mongoose.model('Bit', bitSchema);

  module.exports = Bit;

}).call(this);
