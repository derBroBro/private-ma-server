logger.log("info", "Loading configuration...");
var config = require('./config.json');

logger.log("info", "Set loglevel to " + config.loglevel);
logger.transports.console.level = config.loglevel;

// Load required module
logger.log("info", "Load destination module (" + config.destination + ")...");
var dstModule = require('./destinations/' + config.destination)(config.options);

var ma = {};

ma.convertData = function(data) {
  if (data && data.length > 50) {
    var DataSets = data.length / 64;
    logger.log("debug", DataSets + " datesets sended");

    for (var i = 0; i < DataSets; i++) {
      logger.log("debug", "Work on set " + i+1 + "/" + DataSets);
      var offset = i * 64;

      var dataObj = {};
      dataObj.debug = {};
      dataObj.debug.line = data.toString("hex", offset, offset + 64);
      dataObj.debug.type1 = data.toString("hex", offset, offset + 1);
      dataObj.unixTime = data.readInt32BE(offset + 1);
      dataObj.debug.length = parseInt(data.toString("hex", offset + 5, offset + 6));
      //dataObj.debug.items = (dataObj.debug.length - 6 - 1 - 1) / 2; //6b sn 1b NA 1b LF,  2b per item
      dataObj.deviceId = data.toString("hex", offset + 6, offset + 12);
      dataObj.debug.type3 = data.toString("hex", offset + 12, offset + 13);
      dataObj.debug.nr = data.readUInt8(offset + 13);
      dataObj.data = [];
      dataObj.debug.deviceInformation = ma.getSensorType(dataObj.deviceId);

      dataObj.data = ma.getSensorValue(data, offset, dataObj.debug.deviceInformation);

      logger.log("silly", "Extracted data are:");
      logger.log("silly", dataObj);
      dstModule.save(dataObj);
    }
  }

}
ma.getSensorValue = function(data, offset, type) {
  var result = [];
  for (var n = 0; n < type.sensorCount; n++) {
    var value1 = data.readUInt16BE(offset + 14 + (n * 2)); // value1 -> 0+15+1*2 =17
    var value2 = data.readUInt16BE(offset + 14 + (type.sensorCount * 2 + n * 2)); // value2 -> 0+15+1+1*2 = 18

    if (type.sensors[n] == "temp") { //12bit
      value1 = value1 & 0x0fff;
      //if((value1 >> 11) == 1){} // bit12 is set = *-1
      value2 = value2 & 0x0fff;

      var value = (value1 + value2) / 2;

      result.push({
        value: value / 10,
        type: type.sensors[n],
        unit: "C"
      })
    }
    if (type.sensors[n] == "hum") { //8bit
      value1 = value1 & 0x00ff;
      value2 = value2 & 0x00ff;

      var value = (value1 + value2) / 2;

      result.push({
        value: value,
        type: type.sensors[n],
        unit: "%"
      })
    }
  }
  var battery = data.readUInt8(offset + 15 + type.sensorCount * 4 - 1);
  result.push({
    value: battery,
    type: "battery",
    unit: ""
  });
  return result;
}

ma.getSensorType = function(deviceId) {
  var typeId = deviceId.substring(0, 2);
  var typeInformation = {};
  typeInformation.sensors = [];

  if (typeId == "02") {
    typeInformation.name = "temperature only";
    typeInformation.sensors.push("temp")
  }
  if (typeId == "03") {
    typeInformation.name = "temperature and humity";
    typeInformation.sensors.push("temp")
    typeInformation.sensors.push("hum")
  }

  typeInformation.sensorCount = typeInformation.sensors.length;
  return typeInformation;
}

module.exports = ma;
