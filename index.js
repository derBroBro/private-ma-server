var express = require('express');
var logger = require('express-logger');
var bodyParser = require('body-parser');
var getRawBody = require('raw-body');
var app = express();

app.use(logger({
  path: "logfile.txt"
}));
app.use(bodyParser.urlencoded({
  extended: false
}));

app.put('/gateway/put', function(req, res) {
  console.log("/gateway/put match");
  getRawBody(req, {
    length: req.headers['content-length']
  }, function(err, string) {
    convertData(string);
  });
});

app.all("*", function(req, res) {
  console.log("* match");
  console.log(req.originalUrl);
  console.log(req.headers);
  console.log(req.body);
});


var server = app.listen(8080, function() {
  var port = server.address().port;

  console.log('Proxy is listening at port %s', port);
});

function convertData(data) {
  if (data.length > 50) {
    var DataSets = data.length / 64;
    console.log(DataSets + " datasets found");

    for (var i = 0; i < DataSets; i++) {

      console.log("work on set: " + i);
      var offset = i*64;

      var dataObj = {};
      dataObj.line = data.toString("hex",offset,offset+64);
      dataObj.type1 = data.toString("hex",offset,offset+1);
      dataObj.unixTime = data.readInt32BE(offset+1);
      dataObj.length = parseInt(data.toString("hex",offset+5,offset+6));
      dataObj.items = (dataObj.length-6-1-1)/2; //6b sn 1b NA 1b LF,  2b per item
      dataObj.deviceId = data.toString("hex",offset+6,offset+12);
      dataObj.type3 = data.toString("hex",offset+12,offset+13);
      dataObj.nr = data.readUInt8(offset+13);
      dataObj.data = [];

      for(var j = 0; j < dataObj.items; j++){
        dataObj.data.push(getValue(data,offset,j));
      }

      console.log(dataObj);
    }
  }

}

function getValue(data,offset, index){
  var result = {};
  result.typeId = data.toString("hex",offset+14+(index*2),offset+15+(index*2));
  result.typeId0 = result.typeId.charAt(0);
  result.typeId1 = result.typeId.charAt(1);
  result.value = data.readUInt8(offset+15+(index*2));

  if(result.typeId == "00" || result.typeId == "40" ){ // temp
    result.typeName = "C";
    result.value = result.value/10;
  }
  if(result.typeId == "0a"){ // hum
    result.typeName = "%";
  }
  return result;
}
