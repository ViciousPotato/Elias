fs       = require 'fs'
express  = require 'express'
mongoose = require 'mongoose'
_        = require 'underscore'
moment   = require 'moment'
marked   = require 'marked'
path     = require 'path'
morgan   = require 'morgan'

Bit      = require './models/bit'
util     = require './util'

# Connect to db
mongoose.connect 'localhost', 'elias'

# TODO add code to handle connection failure.

accessLogStream = fs.createWriteStream __dirname+'/log/access.log', flags: 'a'

app = express()
app.use express.bodyParser
  keepExtensions: true
  uploadDir: './static/uploads'
app.use express.cookieParser('secret')
app.use express.session {secret: 'secret'}
app.use express.static __dirname + '/static'
app.use morgan 'combined', stream: accessLogStream

app.set 'views', 'views/'
app.set 'view engine', 'jade'
app.set 'view options', layout : true

marked.setOptions
  highlight: (code) ->
    require('highlight.js').highlightAuto(code).value

app.locals.moment = moment
app.locals.marked = marked
app.locals.util   = util

ObjectId = mongoose.Types.ObjectId

app.use express.bodyParser
  keepExtensions: true,
  uploadDir:      __dirname + '/staic/uploads'

app.get '/', (req, res) ->
  Bit.find {}, null, {sort: {date: -1}}, (error, bits) ->
    groups = _.groupBy bits, (bit) ->
      moment(bit.date).format("MMM|DD")
    Bit.allTopics (topics) ->
      res.render 'main.jade',
        groups: groups
        topics: topics

app.get '/bit/:offset/:limit', (req, res) ->
  Bit.bits req.params.offset, req.params.limit, (error, bits) ->
    res.send
      error: error,
      bits:  bits

app.post '/bit', (req, res) ->
  content = req.param 'content'
  parsed  = util.parse_bit content

  bit = new Bit
    content: parsed.content
    topics:  parsed.topics

  bit.save (error, bit) ->
    res.send
      date:    moment(bit.date).format("HH:MM a")
      content: marked(bit.content)

app.get '/edit/:id', (req, res) ->
  Bit.findOne _id: req.params.id, (error, bit) ->
    res.render 'edit.jade', bit: bit

app.post '/edit/:id', (req, res) ->
  parsed = util.parse_bit req.body.content
  Bit.update _id: req.params.id, {content: parsed.content, topics: parsed.topics}, (err, bit) ->
    res.redirect "/##{req.params.id}"

app.get '/delete/:id', (req, res) ->
  Bit.remove _id: req.params.id, (err, bit) ->
    res.redirect '/'

app.get '/view/:id', (req, res) ->
  Bit.findOne _id: req.params.id, (error, bit) ->
    res.render 'view.jade', bit: bit

app.post '/upload', (req, res) ->
  url = '/uploads/' + path.basename req.files.attach.path
  res.send
    'status': 'success'
    'url': url

app.listen process.env.VCAP_APP_PORT or 3000
