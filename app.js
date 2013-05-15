
var app, express;

express = require('express');
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
  return res.render('main.jade');
});

app.post('/bit', function(req, res) {
  var body, title, user;
  title = req.param('title');
  body = req.param('body');
  return user = req.param('user');
});

app.listen(process.env.VCAP_APP_PORT || 80);

