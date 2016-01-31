var unirest = require('unirest');

module.exports = function(options) {
  logger.log("silly", "Loaded options for thingspeak:");
  logger.log("silly", options);
  var mod = {};
  mod.options = options;
  mod.save = function(data) {

    // if sensor is defined in config
    if (mod.options.devices[data.deviceId]) {
      //Load data
      var parameters = mod.options.devices[data.deviceId];

      // ISO date
      var datetime = new Date(data.unixTime * 1000);
      var datetime_formated = encodeURIComponent(datetime.toISOString());

      var urlParts = [];
      urlParts.push("https://api.thingspeak.com/update?api_key=" + parameters.key);
      urlParts.push("created_at=" + datetime_formated);

      // and add the field for each falie
      var sensors = data.deviceInformation.sensors;
      for (var i = 0; i < sensors.length; i++) {
        var curSensor = sensors[i];
        if (parameters.fields[curSensor]) {
          urlParts.push("field" + parameters.fields[curSensor] + "=" + data.data[curSensor].value);
        } else {
          logger.log("warn", "No data for " + data.deviceId + "/" + curSensor + " found!");
        }
      }
      // glue them together
      var requestUrl = urlParts.join("&");

      logger.log("debug", "Request URL is: " + requestUrl);
      logger.log("debug", "Send request to thingspeak...");
      unirest.post(requestUrl).send()
        .end(function(response) {
          if (response.body == "0") {
            logger.log("warn", "Server rejected data!");
          } else {
            logger.log("debug", "Data stored with id "+ response.body);
          }
        });
    } else {
      logger.log("warn", "No settings for " + data.deviceId + " found!");
    }
  }
  mod.register = function(app) {}
  return mod;
};
