express  = require 'express'
mongoose = require 'mongoose'
pagedown = require 'pagedown'
_        = require 'underscore'
moment   = require 'moment'

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

app.locals.moment    = moment
app.locals.converter = new pagedown.Converter

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
      content: bit.content

app.listen process.env.VCAP_APP_PORT or 3000
