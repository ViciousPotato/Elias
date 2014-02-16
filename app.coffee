express  = require 'express'
mongoose = require 'mongoose'
_        = require 'underscore'
moment   = require 'moment'
marked   = require 'marked'

Bit      = require './models/bit'

# Connect to db
mongoose.connect 'localhost', 'elias'

app = express()
app.use express.bodyParser()
app.use express.cookieParser('secret')
app.use express.session {secret: 'secret'}
app.use express.static __dirname + '/static'

app.set 'views', 'views/'
app.set 'view engine', 'jade'
app.set 'view options', layout : true

marked.setOptions
  highlight: (code) ->
    require('highlight.js').highlightAuto(code).value

app.locals.moment = moment
app.locals.marked = marked

ObjectId = mongoose.Types.ObjectId

app.get '/', (req, res) ->
  Bit.find {}, null, {sort: {date: -1}}, (error, bits) ->
    groups = _.groupBy bits, (bit) ->
      moment(bit.date).format("MMM|DD")
    res.render 'main.jade', groups: groups

app.post '/bit', (req, res) ->
  content = req.param 'content'
  bit = new Bit
    content: content

  bit.save (error, bit) ->
    res.send
      date:    moment(bit.date).format("HH:MM a")
      content: marked(bit.content)

app.get '/edit/:id', (req, res) ->
  Bit.findOne _id: req.params.id, (error, bit) ->
    res.render 'edit.jade', bit: bit

app.post '/edit/:id', (req, res) ->
  Bit.update {_id: req.params.id}, {content: req.body.content}, (err, bit) ->
    res.redirect "/edit/#{req.params.id}"

app.listen process.env.VCAP_APP_PORT or 3000
