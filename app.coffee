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

Bit      = require './models/bit'
Activity = require './models/activity'
util     = require './util'
config   = require './config'

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
    res.render 'main.jade', topics: topics

app.get '/bit/:offset/:limit', (req, res) ->
  Bit.bits req.params.offset, req.params.limit, marked, (error, bits) ->
    groups = _.groupBy bits, (bit) ->
      moment(bit.date).format("MMM|DD") # MMM means 3 char month name e.g. Oct

    res.send
      error: error,
      bits:  groups

# Create new bit
app.post '/bit', (req, res) ->
  content = req.param 'content'
  parsed  = util.parse_bit content

  rawContent = parsed.content
  topics = parsed.topics # TODO: The case of empty topic
  bit = new Bit
    content: rawContent
    topics:  topics

  bit.save (error, bit) ->
    bit.content = marked(content)

    async.each topics, (topic, cb) ->
        actitivity = new Activity
          topic: topic
          action: 'Add'
          detail: 'Added bit: ' + util.shorten_text(rawContent, 10)
          bitId:  bit._id

        actitivity.save (error, act) ->
          # FIXME ignore errors
          cb()
      , (error) ->
        # FIXME ignore errors
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

app.listen process.env.VCAP_APP_PORT or 3000
