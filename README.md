# Why this project?
This server can be used to collect data from a Mobile Alerts Gateway.
Personal I would prefer to use the service provided by the manufacturer but sadly this has been modified multiple times. As other users are reporting the manufacturer don't want the endusers consuming his service.

# What is currently supported?
Currently the project can only show the values collected by all sensors connected to the gateway.
The data could be written to JSON files or send to thingspeak.com. The Filesystem destination includes all information and could be used for debugging.

# What is not supported but planned?
The long term target would be to fully understand the protocol and to create connectors to different locations (database etc.).

*For example it is clear how normaly/partial the sensor values are encoded. Sadly this is for the temperature only one byte which are then shift by one decimal place. This results in a value from 0 (=0.0°C) to 255 (=25.5°C).*

# How to start
__NOTE BEFORE!__
I am not responsible if you break your gateway. So if you follow the instructions below you accept this without any limitations!
* Download and install the Admin-Tool for the Gateway (http://www.weatherdirect.com/help/software.aspx)
* Checkout the project
* Create a config.json (you can also use the config.fs_example.json by renaming)
* Run the commands:
  * npm install
  * node index.js
* Start the tool and check "use ... as Proxyserver" and insert the IP of your server and the port 8080. Click set.

# How does it work in behind?
Currently the protocol is still not completely clear for me. What we can see is:
* the gateway calls the proxy server at /gateway/put (HTTP) at two points
  * at the bootup (includes gateway serial number etc..) (length = 21bytes)
  * if new / cached data are available (length modulo 64 = 0)
* the sensordata are chunked into 64 bytes long parts for each record (deviceId + timestamp)
* each requests which also includes the gateway serial number and other data
* each of the records is built as follow:

|start|length|description
|---|---|---
|0|1|unknown (device type?)
|1|4|Unix Timestamp
|5|1|length / sensor values (2bytes for each value / ?)
|6|6|device id
|11|1|unknown (also something about the device type?)
|13|1|consecutive number (deviceId)
|.|.|
|14+n|1|unknown
|15+n|1|value (temperature: shift by one decimal place, humidity: normal)
|.|.|
|63|1|Checksum(?)

The device type is related to the ID. 02 means temperature only, 03 temperature and humidity. Other devices and their values must be investigated.
I am not sure but is think there must be also a "battery" flag.

# How can I support?
You can work on the code as well as provide information about you sensor data to help to understand how them work.
I personal own only a MA10100 and MA10200 sensor so any data from another device would be interesting. Please post for this all the JSON output.
