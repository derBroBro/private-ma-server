# Why this project?
This server can be used to collect data from a Mobile Alerts Gateway.
Personal I would prefer to use the service provided by the manufacturer but sadly this has been modified multiple times. As other users are reporting the manufacturer don't want the endusers consuming his service.

# What is currently supported?
Currently the project can only show the values collected by all sensors connected to the gateway.
The data could be written to JSON files or send to thingspeak.com. The Filesystem destination includes all information and could be used for debugging.

# What is not supported but planned?
The long term target would be to fully understand the protocol and to create connectors to different locations (database etc.).


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
* each requests which also includes the gateway mac address and other data
* each of the records is built as follow:

|start|length|description
|---|---|---
|0|1|unknown (device type?)
|1|4|Unix Timestamp
|5|1|unknown (length? but sometimes unknown sensor values are added)
|6|6|device id
|11|1|unknown (also something about the device type?)
|13|1|consecutive number (deviceId)
|.|.|
|14+n|2|first 4 bits unknown, next 2 datatype(?) for type=00 (last 8bit for humidity) type=01 (last 12 for temperature, xor *-1, moved by one comma) type=10 (last 12bits moved by one comma)
|.|.|
|x|1|battery?
|63|1|Checksum(?)

Startup Request Record:
|start|length|description
|---|---|---
|0|1| unknown (always 0x13)
|1|4| unixTime
|4|6| mac
|10|8| unknown (zeros)

Startup Responce Record:
|start|length|description
|---|---|---
|0|2| unknown (zeros)
|2|2| unknown (01 a4 )
|2|4| unknown (zeros)
|8|4| unixTime
|12|4| unknown (zeros)
|16|4| unknown (17 61 d4 80)
|20|2| unknown (zeros)
|22|2| unknown (00 0f)


The device type is related to the ID. 02 means temperature only (MA10100), 03 temperature and humidity (MA10200). Other devices and their values must be investigated.
Interesting are that the byte 0,5 and 6 look like some kind of device specific.
MA10100: byte1 = ce, byte5 = 12, byte6 = 02
MA10200: byte1 = d2, byte5 = 16, byte6 = a3
I am not sure but is think there must be also a "battery" flag.

# How can I support?
You can work on the code as well as provide information about you sensor data to help to understand how them work.
I personal own only a MA10100 and MA10200 sensor so any data from another device would be interesting. Please post for this all the JSON output.
