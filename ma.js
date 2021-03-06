var getRawBody = require('raw-body');

logger.log("info", "Loading configuration...");
var config = require('./config.json');

logger.log("info", "Set loglevel to '" + config.loglevel + "'");
logger.transports.console.level = config.loglevel;

// Load required module
logger.log("info", "Load module '" + config.module + "'");
var dstModule = require('./modules/' + config.module)(config.options);

var ma = {};

// handle bootups
ma.processBootup = function(data,res,gatewayInfo) {
  logger.log("info", "Got bootup message...");

  var time = Math.floor(Date.now() / 1000);

  var buf = new Buffer(24);
  var preBuf = new Buffer([0x00,0x00,0x01,0xa4,0x00,0x00,0x00,0x00]) // prefix
  var postBuf = new Buffer([0x00,0x00,0x00,0x00,0x17,0x61,0xd4,0x80,0x00,0x00,0x00,0x0f]) // postfix

  preBuf.copy(buf);
  buf.writeUInt32BE(time, 8, 4); // time
  postBuf.copy(buf,12);

  logger.log("info", "Send datetime...");
  logger.log("silly", buf.toString("hex"));

  res.setHeader('content-type', 'application/octet-stream');
  res.status(200)
  res.end(buf);
}

ma.processSensorData = function(data,res,gatewayInfo) {
  var DataSets = data.length / 64;
  logger.log("debug", DataSets + " datesets sended");

  for (var i = 0; i < DataSets; i++) {
    logger.log("debug", "Work on set " + (i + 1) + "/" + DataSets);
    var offset = i * 64;

    var dataObj = {};
    dataObj.debug = {};
    dataObj.debug.line = data.toString("hex", offset, offset + 64);
    dataObj.debug.type1 = data.toString("hex", offset, offset + 1);
    dataObj.unixTime = data.readInt32BE(offset + 1);
    dataObj.debug.length = parseInt(data.toString("hex", offset + 5, offset + 6));
    //dataObj.debug.items = (dataObj.debug.length - 6 - 1 - 1) / 2; //6b sn 1b NA 1b LF,  2b per item
    dataObj.deviceId = data.toString("hex", offset + 6, offset + 12);
    dataObj.debug.type2 = data.toString("hex", offset + 12, offset + 13);
    dataObj.debug.nr = data.readUInt8(offset + 13);
    dataObj.deviceInformation = ma.getSensorType(dataObj.deviceId);

    var lastValueOffset = offset + 15 + dataObj.deviceInformation.sensors.length * 4 - 1;
    dataObj.debug.type3 = data.toString("hex", lastValueOffset, lastValueOffset + 1);

    dataObj.data = ma.getSensorValue(data, offset, dataObj.deviceInformation);

    logger.log("silly", "Extracted data are:");
    logger.log("silly", dataObj);
    dstModule.save(dataObj);
  }
  res.sendStatus(200);
}
ma.getSensorValue = function(data, offset, type) {
  var result = {};
  for (var n = 0; n < type.sensorCount; n++) {
    var value1 = data.readUInt16BE(offset + 14 + (n * 2)); // value1 -> 0+15+1*2 =17
    var value2 = data.readUInt16BE(offset + 14 + (type.sensorCount * 2 + n * 2)); // value2 -> 0+15+1+1*2 = 18

    var value = ma.conertValues(value1, value2);
	var unit = "";
	
	if (type.sensors[n][0] == "temp") {
		unit = "C";
	} else if (type.sensors[n][0] == "hum") {
		unit = "%";
	}

	result[type.sensors[n][1]] = {
		value: value,
		type: type.sensors[n][0],
		unit: unit
	};	
  }
  /*
  var battery = data.readUInt8(offset + 15 + type.sensorCount * 4 - 1);
  result["battery"] = {
    value: battery,
    type: "battery",
    unit: ""
  };
  */
  return result;
}

// there are multiple value types which are corrected by this function
ma.conertValues = function(value1, value2) {

  var value = 0;
  // debug
  var datatype = (value1 & 0x0c00) >> 10; // bit 5+6
  switch (datatype) {
    case 0: // 10 bit positive, 1 point comma
      value1 = value1 & 0x03ff;
      value2 = value2 & 0x03ff;
      var avgValue = (value1 + value2) / 2;
      value = avgValue / 10;
      break;
    case 1: // 4 bit, negative, 1 point comma
      value1 = (value1 & 0x03ff) ^ 0x03ff;
      value2 = (value2 & 0x03ff) ^ 0x03ff;
      var avgValue = (value1 + value2) / 2;
      value = avgValue / 10 * -1;
      break;
    case 2: // 10bit postive
      value1 = value1 & 0x00ff;
      value2 = value2 & 0x00ff;
      var avgValue = (value1 + value2) / 2;
      value = avgValue;
      break;
    default:

  }

  logger.log("debug", "type: " + datatype + " - value: " + value);
  return value;
}

ma.getSensorType = function(deviceId) {
  var typeId = deviceId.substring(0, 2);
  var typeInformation = {};
  typeInformation.sensors = [];

  switch (typeId) {
    case "02":
      typeInformation.name = "temperature only";
      typeInformation.sensors.push(["temp","temp"]);
      break;

    case "03":
      typeInformation.name = "temperature and humity";
      typeInformation.sensors.push(["temp","temp"]);
      typeInformation.sensors.push(["hum","hum"]);
      break;
	  
   case "07":
      typeInformation.name = "temperature and humity, inside and outside";
      typeInformation.sensors.push(["temp","tempIn"]);
      typeInformation.sensors.push(["hum","humIn"]);
      typeInformation.sensors.push(["temp","tempOut"]);
      typeInformation.sensors.push(["hum","humOut"]);	  
      break;	  
	  
    default:
      logger.log("debug", "Device with type='" + typeId + "' are currently not supported.");
      logger.log("debug", "Pleas reporting the type '" + typeId + "' with at github! :-).");
  }

  typeInformation.sensorCount = typeInformation.sensors.length;
  return typeInformation;
}

// Register and and execute routes
ma.register = function(app) {
  logger.log("debug", "Register route /gateway/put");
  app.put('/gateway/put', function(req, res) {
    logger.log("debug", "Got request for /gateway/put");
    logger.log("silly", req.headers);

    gatewayInfo = ma.identify(req);
    logger.log("silly", gatewayInfo);

    // load body
    getRawBody(req, {
      length: req.headers['content-length']
    }, function(err, buf) {
      logger.log("silly", buf.toString("hex"));
      logger.log("silly", err);
      switch (gatewayInfo.field1) {
        case "C0":
          ma.processSensorData(buf,res,gatewayInfo);
          break;

        case "00":
          ma.processBootup(buf,res,gatewayInfo);
          break;

        default:
          logger.log("warn", "Unknown message type '" + gatewayInfo.field1 + "' received!");
          logger.log("warn", "Please report type '" + gatewayInfo.field1 + "' at github!");
      }
    });
  });

  logger.log("debug", "Register Module routes...");
  dstModule.register(app);
}

// Get the header Data
ma.identify = function(req) {
  var headerData = req.headers.http_identify.split(":");
  var gatewayInfo = {};
  gatewayInfo.sn = headerData[0];
  gatewayInfo.mac = headerData[1];
  gatewayInfo.field1 = headerData[2];

  return gatewayInfo;
}

module.exports = ma;
