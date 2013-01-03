express = require 'express'

app = express()

app.use express.bodyParser()
app.use express.cookieParser('secret')
app.use express.session {secret: 'secret'}

app.set 'views', 'views/'
app.set 'view engine', 'jade'
app.set 'view options', {layout : true}

app.get '/', (req, res) ->
	res.send 'Hello'

app.listen 80

