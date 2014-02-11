// Generated by CoffeeScript 1.4.0
(function() {
  var Bit, app, express, mongoose;

  express = require('express');

  mongoose = require('mongoose');

  Bit = require('./models/bit');

  mongoose.connect('localhost', 'elias');

  app = express();

  app.use(express.bodyParser());

  app.use(express.cookieParser('secret'));

  app.use(express.session({
    secret: 'secret'
  }));

  app.use(express["static"](__dirname + '/static'));

  app.set('views', 'views/');

  app.set('view engine', 'jade');

  app.set('view options', {
    layout: true
  });

  app.get('/', function(req, res) {
    return Bit.find({}, function(error, bits) {
      return res.render('main.jade', {
        bits: bits
      });
    });
  });

  app.post('/bit', function(req, res) {
    var bit, content, title;
    title = req.param('title');
    content = req.param('content');
    bit = new Bit({
      title: title,
      content: content
    });
    return bit.save(function(error, bit) {
      return res.send({
        status: 'ok'
      });
    });
  });

  app.listen(process.env.VCAP_APP_PORT || 8080);

}).call(this);