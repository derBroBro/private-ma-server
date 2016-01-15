var fs = require('fs');

module.exports = function(options) {
  var mod = {};
  mod.options = options;

  mod.save = function(data) {
    var filename = mod.options.path + "/" + data.deviceId + ".json";
    logger.log("debug", "File " + filename + " created...");
    fs.writeFileSync(filename, JSON.stringify(data));
  }

  mod.read = function(id) {
    var filename = mod.options.path + "/" + id + ".json";
    logger.log("debug", "Read file " + filename + "...");
    if (fs.existsSync(filename)) {
      var rawData = fs.readFileSync(filename);
      return JSON.parse(rawData);
    } else {
      logger.log("warn", "File " + filename + " not found!");
    }
  }

  mod.register = function(app) {
    logger.log("debug", "Register route /favicon.ico");
    app.get('/favicon.ico', function(req, res) {
      res.sendStatus(404); // no favicon!
    })
    logger.log("debug", "Register route /devices/:id");
    app.get('/devices/:id', function(req, res) {
      var id = req.params.id;
      var data = mod.read(id);
      if (data) {
        //remove debug
        delete data.debug;
        res.json(data);
      } else {
        res.sendStatus(404);
      }
    });
  }

  return mod;
};
