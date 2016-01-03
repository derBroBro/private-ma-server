# Why this project?
This servers can be used to collect data of my Mobile Alerts Gateway.
Personal I would prefer to use the service provided by the manufacturer but saddly this has been modified multiple times. As other users reporting the manufacturer don't want endusers consuming the service.

# What is currently supported?
Currently the project can only show the values collected by all sensors connected to the gateway.

# What is not supported but planned?
The long term target would be to fully understand the protocol and to create connectors to different locations (fs, database etc.).
At the moment the Data are not accepted (no HTTP 200 is send). Because of this it looks like the gateway will still cache as much data as possible.

*For example it is clear how normaly/partial the sensor values are encoded. Saddly this is for the temperature only one byte which are then shift by one decimal place. This result in a value of o (=0.0°C) to 253 (25.3°C).*

# How to start
__NOTE BEFORE!__
I'am not responsible if you break you gateway. So if you follow the instructions below you accept this without any limitations!
* Download and install the Admin-Tool for the Gateway (http://www.weatherdirect.com/help/software.aspx)
* Checkout the project and run:
  * npm install
  * node index.js
* Start the tool and check "use ... as Proxyserver" and insert the IP of your server and the port 8080. Click set.

# How does it work in behind?
Currently the protocol is still not completely clear for me. What we can see is:
* the gateway call the proxy server at /gateway/put (HTTP) at two points
  * at the bootup (includes gateway serial number etc..) (length = 21bytes)
  * if new / cached data are available (length modulo 64 = 0)
* the sensordata are chunked into 64 bytes long parts for each record (deviceId + timestamp)
* each of the records is built as follow:

|start|length|description
|---|---|---
|0|1]|unknown (device type?)
|1|4|Unix Timestamp
|5|1|sensor values (2bytes for each value)
|6|6|device id
|11|1|unknown (also something about the device type?)
|.|.|
|13+n|1|Datatype (? - 0x00 or 0x40=temperature in °C / 0x0a=humity in %)
|14+n|1|value (temperature: shift by one decimal place, humidity: normal)
|.|.|
|63|1|Checksum(?)

# How can I support?
You can work on the code as well as provide informations about you sensor data to help to understand how them work.
I personal own only a MA10100 and MA10200 sensor so any data from another device would interesting. For this please post all the JSON output.
