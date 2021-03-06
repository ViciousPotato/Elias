var fs = require('fs')
  , express = require('express')
  , mongoose = require('mongoose')
  , _ = require('underscore')
  , moment = require('moment')
  , marked = require('marked')
  , path = require('path')
  , morgan = require('morgan')
  , async = require('async')
  , gm = require('gm')
  , pdc = require('pdc')
  , temp = require('temp')
  , favicon = require('serve-favicon');

var Bit = require('./models/bit')
  , Activity = require('./models/activity')
  , Article = require('./models/article')
  , util = require('./util')
  , config = require('./config');

temp.track();

mongoose.connect('localhost', 'elias', function(err) {
  if (err) {
    console.log("Failed connecting to mongodb: " + err);
    return process.exit(-1);
  }
});

var accessLogStream = fs.createWriteStream(__dirname + '/log/access.log', {
  flags: 'a'
});

var app = express();

app.use(express.bodyParser({
  keepExtensions: true,
  uploadDir: './static/uploads'
}));
app.use(express.cookieParser('secret'));
app.use(express.session({
  secret: 'secret'
}));
app.use(express["static"](__dirname + '/static'));
app.use(morgan('combined', {
  stream: accessLogStream
}));

app.use(favicon(__dirname + "/static/img/favicon.ico"));

app.set('views', 'views/');
app.set('view engine', 'jade');
app.set('view options', {
  layout: true
});

marked.setOptions({
  highlight: function(code) {
    return require('highlight.js').highlightAuto(code).value;
  }
});

app.locals.moment = moment;
app.locals.marked = marked;
app.locals.util = util;

ObjectId = mongoose.Types.ObjectId;

app.use(express.bodyParser({
  keepExtensions: true,
  uploadDir: __dirname + '/staic/uploads'
}));

app.use(function(req, res, next) {
  if ('/robots.txt' === req.url) {
    res.type('text/plain');
    return res.send('User-agent: *\nDisallow: /delete\nDisallow: /edit');
  } else {
    return next();
  }
});

app.get('/', function(req, res) {
  return Bit.allTopics(function(topics) {
    return res.render('main.jade', {
      topics: topics,
      util: util,
      marked: marked
    });
  });
});

app.get('/bits', function(req, res) {
  return Bit.all(function(err, bits) {
    res.send({
      error: err,
      bits: bits
    });
  });
});

app.get('/bit/since/:timestamp', function(req, res) {
  return Bit.bits_since(parseInt(req.param('timestamp')), function(err, bits) {
    var transformedBits;
    transformedBits = _.map(bits, function(bit) {
      bit.content = marked(bit.content);
      return bit;
    });
    return res.send(transformedBits);
  });
});

app.get('/bit/pdf/:id', function(req, res) {
  var i;
  i = req.params.id;
  return Bit.findOne({
    _id: i
  }, function(error, bit) {
    if (!error) {
      return temp.open({
        "prefix": 'elias_gen_pdf_',
        "suffix": ".pdf"
      }, function(error, info) {
        if (!error) {
          console.log(info);
          return pdc(bit.content, 'markdown', 'latex', "-o" + info.path, function(error, result) {
            if (error) {
              throw error;
            }
            return res.sendfile(info.path);
          });
        } else {
          return res.send("Error, can not open temp file: " + error);
        }
      });
    } else {
      return res.send("Error, can not find this bit: " + error);
    }
  });
});

app.get('/bit/paging/:offset/:limit', function(req, res) {
  return Bit.bits(req.params.offset, req.params.limit, marked, function(error, bits) {
    var groups;
    groups = _.groupBy(bits, function(bit) {
      return moment(bit.date).format("MMM|DD");
    });
    return res.send({
      error: error,
      bits: groups
    });
  });
});

app.post('/bit', function(req, res) {
  var content = req.param('content');
  var id = req.param('id');

  if (id) {
    // edit save mode
    return Bit.update({
      _id: id
    }, {
      content: content,
      lastModified: Date.now()
    }, function(err, bit) {
      return res.send({
        error: err,
        bit: bit
      });
    });
  }

  // Create new bit
  var bit = new Bit({
    content: content
  });

  return bit.save(function(error, bit) {
    bit.content = marked(content);
    return res.send({
      error: error,
      bit: bit
    });
  });
});

app.get('/bit/edit/:id', function(req, res) {
  return Bit.findOne({
    _id: req.params.id
  }, function(error, bit) {
    return res.render('edit.jade', {
      bit: bit
    });
  });
});

app.get('/bit/get/:id', function(req, res) {
  return Bit.findOne({
    _id: req.params.id
  }, function(error, bit) {
    return res.send({error: error, bit: bit});
  });
});

app.post('/bit/edit/:id', function(req, res) {
  var parsed = util.parse_bit(req.body.content);
  return Bit.update({
    _id: req.params.id
  }, {
    content: parsed.content,
    topics: parsed.topics
  }, function(err, bit) {
    return res.redirect("/#" + req.params.id);
  });
});

app.get('/bit/delete/:id', function(req, res) {
  return Bit.remove({
    _id: req.params.id
  }, function(err, bit) {
      console.log(err, bit);
      return res.send({error: err});
  });
});

app.get('/view/:id', function(req, res) {
  return Bit.findOne({
    _id: req.params.id
  }, function(error, bit) {
    return res.render('view.jade', {
      bit: bit
    });
  });
});

// == Article ==
app.get('/topics', function(req, res) {
  return Bit.topics(function(error, topics) {
    if (error) {
      return res.send({
        error: error
      });
    }
    return res.send({
      topics: topics
    });
  });
});

app.get('/article/latest', function(req, res) {
  Article.latest(function(error, article) {
    return res.send({error: error, article: article});
  });
});

app.get('/article/metas', function(req, res) {
  Article.find(
    {},
    {title: 1, created: 1, lastModified: 1, _od: 1},
    function(error, articles) {
      return res.send({error: error, metas: articles});
    });
});

app.get('/article/:id', function(req, res) {
  var id = req.params.id;

  return Article.findOne({_id: id}, function(error, article) {
     return res.send({error: error, article: article})
  })
});

app.get('/article/title/:title', function(req, res) {
  var title = req.params.title;
  return Article.get(title, function(error, article) {
    return res.send({
      error: error,
      article: article
    });
  });
});

// Create Article
app.post('/article', function(req, res) {
  var title = req.param('title');
  var content = req.param('content');

  var article = new Article({
    title: title,
    content: content
  });

  return article.save(function(error, article) {
    return res.send({
      error: error,
      article: article
    });
  })
});

// Update article
app.post('/article/:id', function(req, res) {
  var id = req.params.id;
  var content = req.param('content');
  var title = req.param('title');
  return Article.update(
    { _id: id },
    { content: content, title: title },
    { upsert: true },
    function(error, article) {
      return res.send({
        error: error,
        article: article
      });
    });
});

app.get('/topic/pdf/:topicname', function(req, res) {
  var topic_name;
  topic_name = req.params.topicname;
  return Bit.bitsInTopic(topic_name, function(bits) {
    return util.bits_to_pdf(bits, function(error, path) {
      if (error) {
        throw error;
      }
      return res.sendfile(path);
    });
  });
});


app.post('/upload', function(req, res) {
  var fileExt, scaledUrl, url;
  url = '/uploads/' + path.basename(req.files.attach.path);
  fileExt = path.extname(url);
  if (fileExt === '.jpg' || fileExt === '.png' || fileExt === '.bmp') {
    scaledUrl = url + "-resized" + fileExt;
    return gm("./static/" + url).resize(config.image_width_scale).write("./static/" + scaledUrl, function(err) {
      return res.send({
        'status': err,
        'url': url,
        'scaled': scaledUrl,
        'type': 'image'
      });
    });
  } else {
    return res.send({
      'status': 'success',
      'url': url,
      'type': 'normal'
    });
  }
});

app.get('/upload/delete/:file', function(req, res) {
  return res.send('oh shoot');
});

app.listen(process.env.VCAP_APP_PORT || 8080, '0.0.0.0');
