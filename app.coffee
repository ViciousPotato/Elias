express = require 'express'

app = express()

app.use express.bodyParser()
app.use express.cookieParser('secret')
app.use express.session {secret: 'secret'}
app.use express.static __dirname + '/static'

app.set 'views', 'views/'
app.set 'view engine', 'jade'
app.set 'view options', {layout : true}

app.get '/', (req, res) ->
	res.render 'main.jade'

app.post '/bit', (req, res) ->
	title = req.param 'title'
	body = req.param 'body'
	user = req.param 'user'

app.listen 80

