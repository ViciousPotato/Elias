var mongoose = require('mongoose')
  , _ = require('underscore')
  , Bit = require('./bit')
  , util = require('../util');

var articleSchema = new mongoose.Schema({
  title: String,
  content: String,
  bitsMapping: [], // [{start: index, end: index, bit: bitID}, ]
  // TODO: how mongo can store whole bit here and sync the modification without using bitID?
  created: {
    type: Date,
    "default": Date.now
  },
  lastModified: {
    type: Date,
    "default": Date.now
  }
});

articleSchema.statics.latest = function(cb) {
  this.findOne().sort({$natural: -1}).exec(cb);
};

articleSchema.statics.createIfNotExists = function(name, content, cb) {
  var article = new Article({
    title: name,
    content: content
  });
  return article.save(cb);
};

/*
articleSchema.statics.get = function(topic, cb) {
  return Bit.bitsInTopic(topic, function(error, bits) {
    if (error) {
      return cb(error);
    }
    return Article.findOne({
      topic: topic
    }, function(error, article) {
      var contents;
      if (error || !article) {
        contents = _.map(bits, function(bit) {
          return bit.content;
        });
        article = new Article({
          content: contents.join('\n\n'),
          topic: topic
        });
        return article.save(function(error, article) {
          if (error) {
            return cb(error);
          }
          article.bits = bits;
          return cb(null, article);
        });
      } else {
        article.bits = bits;
        return cb(null, article);
      }
    });
  });
};
*/

articleSchema.statics.titles = function(callback) {
  return Article.find({}, function(error, articles) {
    if (error) {
      return callback(error, null);
    }
    var titles = _.map(articles, function(article) {
      return [article.title, article.lastModified];
    });
    return callback(null, titles);
  });
};

var Article = mongoose.model('Article', articleSchema);

module.exports = Article;
