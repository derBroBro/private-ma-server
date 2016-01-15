var fs = require('fs');

module.exports = function(options){
  var mod = {};
  mod.options = options;

  mod.save = function(data){
    var filename = data.deviceId+"_"+data.unixTime+".json";
      logger.log("debug","File "+filename+" created...");
    fs.writeFileSync(mod.options.path+"/"+filename,JSON.stringify(data));
  }

  return mod;
};
