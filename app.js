/**
 * serve the static files up with express
 */
 var express = require('express'),
     http = require('http'),
     path = require('path'),
      app = express();

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) res.send(500, { error: 'Something blew up!' }); 
  else ext(err);
}

app.set('port', 3030);
app.use(clientErrorHandler);
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.logger('dev'));

app.use('/app', express.static(__dirname + '/app'));

app.get('*', function (req, res) { res.sendfile(path.join(__dirname, 'app/index.html')); });

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
