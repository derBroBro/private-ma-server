// Setup Loggin
var winston = require('winston');
global.logger = new winston.Logger();
logger.add(winston.transports.Console, {
  level: 'debug',
  prettyPrint: true,
  colorize: true,
  silent: false,
  timestamp: true
});

var ma = require('./ma');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.urlencoded({
  extended: false
}));

ma.register(app);

app.all("*", function(req, res) {
  logger.log("debug","Got request for "+req.originalUrl);
  logger.log("silly",req.headers);
  logger.log("silly",req.body);
});

var server = app.listen(8080, function() {
  var port = server.address().port;
  logger.log("info","Proxy is listening at port "+ port);
});
