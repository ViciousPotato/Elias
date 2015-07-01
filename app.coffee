fs       = require 'fs'
express  = require 'express'
mongoose = require 'mongoose'
_        = require 'underscore'
moment   = require 'moment'
marked   = require 'marked'
path     = require 'path'
morgan   = require 'morgan'
async    = require 'async'
gm       = require 'gm'
pdc      = require 'pdc'
temp     = require 'temp'

Bit      = require './models/bit'
Activity = require './models/activity'
Article  = require './models/article'
util     = require './util'
config   = require './config'

temp.track()

# Connect to db
mongoose.connect 'localhost', 'elias', (err) ->
  if err
    console.log "Failed connecting to mongodb: " + err
    process.exit -1

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

app.use (req, res, next) ->
  if '/robots.txt' == req.url
    res.type 'text/plain'
    res.send 'User-agent: *\nDisallow: /delete\nDisallow: /edit'
  else
    next()

app.get '/', (req, res) ->
  Bit.allTopics (topics) ->
    res.render 'main.jade', { topics: topics, util: util, marked: marked }

app.get '/bit/since/:timestamp', (req, res) ->
  Bit.bits_since parseInt(req.param 'timestamp'), (err, bits) ->
    transformedBits = _.map bits, (bit) ->
      bit.content = marked bit.content
      bit
    res.send transformedBits

app.get '/bit/pdf/:id', (req, res) ->
  i = req.params.id
  Bit.findOne _id: i, (error, bit) ->
    if not error
      temp.open {"prefix": 'elias_gen_pdf_', "suffix": ".pdf"}, (error, info) ->
        if not error
          console.log info
          pdc bit.content, 'markdown', 'latex', "-o#{info.path}", (error, result) ->
            if error
              throw error
            res.sendfile(info.path)
        else
          res.send "Error, can not open temp file: #{error}"
    else
      res.send "Error, can not find this bit: #{error}"

app.get '/topics', (req, res) ->
  # Get a list of topics, order by last update time.
  Bit.topics (error, topics) ->
    if error
      return res.send error: error
    res.send topics: topics

app.get '/article/:topicname', (req, res) ->
  topic_name = req.params.topicname
  Article.get topic_name, (error, article) ->
    if error
      return res.send 'error': error
    res.send article

app.post '/article/:id', (req, res) ->
  id = req.params.id
  content = req.param 'content'
  topic = req.param 'topic'
  # if we have content
  if content
    if topic
      # Update all topic name first
    Article.update {_id: id}, {content: content, topic: topic}, {upsert: true}, (error, dbmsg) ->
      if error
        res.send 'error': error
      else
        res.send 'status': 'ok'
  else
    res.send 'status': 'ok although I don\'t know why you post empty content'

app.get '/topic/pdf/:topicname', (req, res) ->
  topic_name = req.params.topicname
  Bit.bitsInTopic topic_name, (bits) ->
    util.bits_to_pdf bits, (error, path) ->
      if error
        throw error # TODO error handling
      res.sendfile path

app.get '/bit/:offset/:limit', (req, res) ->
  Bit.bits req.params.offset, req.params.limit, marked, (error, bits) ->
    groups = _.groupBy bits, (bit) ->
      moment(bit.date).format("MMM|DD") # MMM means 3 char month name e.g. Oct

    res.send
      error: error,
      bits:  groups

# Create new bit
app.post '/bit', (req, res) ->
  topic = req.param 'topic'
  content = req.param 'content'
  #parsed  = util.parse_bit content

  #rawContent = parsed.content
  #topics = parsed.topics
  bit = new Bit
    content: content
    topics:  [topic]

  bit.save (error, bit) ->
    bit.content = marked(content)

    async.each topics, (topic, cb) ->
      actitivity = new Activity
        topic: topic
        action: 'Add'
        detail: 'Added bit: ' + util.shorten_text(rawContent, 10)
        bitId:  bit._id

      actitivity.save (error, act) -> cb()  
    , (error) ->
      # FIXME ignore errors
      if error
        res.send error: error
      else
        res.send bit

app.get '/edit/:id', (req, res) ->
  Bit.findOne _id: req.params.id, (error, bit) ->
    res.render 'edit.jade', bit: bit

# Save edit result
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
  # TODO: error handling here.
  url = '/uploads/' + path.basename req.files.attach.path
  fileExt = path.extname url
  if fileExt in ['.jpg', '.png', '.bmp'] # TODO: case
    # Scale down image
    scaledUrl = "#{url}-resized#{fileExt}"
    gm("./static/#{url}").resize(config.image_width_scale).write "./static/#{scaledUrl}", (err) ->
      res.send
        'status': err
        'url': url
        'scaled': scaledUrl
        'type': 'image'
  else
    res.send
      'status': 'success'
      'url': url
      'type': 'normal'

app.get '/upload/delete/:file', (req, res) ->
  res.send 'oh shoot'

app.listen process.env.VCAP_APP_PORT or 3000
