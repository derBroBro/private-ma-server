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
var getRawBody = require('raw-body');

var app = express();

app.use(bodyParser.urlencoded({
  extended: false
}));

app.put('/gateway/put', function(req, res) {
  logger.log("debug","Got request for /gateway/put");
  logger.log("debug",req.headers);

  getRawBody(req, {
    length: req.headers['content-length']
  }, function(err, string) {
    ma.convertData(string);
    res.sendStatus(200)
  });
});

app.all("*", function(req, res) {
  logger.log("debug","Got request for "+req.originalUrl);
  logger.log("debug",req.headers);
  logger.log("debug",req.body);
});

var server = app.listen(8080, function() {
  var port = server.address().port;
  logger.log("info","Proxy is listening at port "+ port);
});
