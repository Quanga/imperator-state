# AECE Centralized Braster Router

## 1. Introduction

The AECE Centralized Blast Router ('CBR') is an application written in Javascript for Node, and although intended to run on a Raspberry Pi (model 3), it can run on any environment where Node is installed.

The intended use of the CBR is to receive incoming messages from an AECE Centralized Blasting System Control device, via a serial connection, and to process these messages. Outgoing messages to the Control are either scheduled or user-initiated, and involve a 'request'/'response' style flow, where responses are parsed and processed as per standard incoming messages.

## 2. Preparation/prerequisites

The installation of the application and its dependencies has the following prerequisites:

### Linux OS

- Board running a linux OS

#### Setting up the serial connection on the RPi:

- Update the RPi firmware:
```bash
> sudo apt-get update
> sudo apt-get upgrade
> sudo rpi-update
```
- By default, the Pi 3 uses the serial port for console input/output. This needs to be disabled:
```bash
> sudo raspi-config
```

``` 
    Advanced Options > Serial > Would you like a login shell to be accessible over serial? > No
```
- Edit the __/boot/config.txt file__ and ensure the following is set:
```bash
enable_uart=1
core_freq=250
arm_freq=1200
```
- Reboot
```bash
> sudo reboot
```
- Check tty configuration:
```bash
> dmesg | grep tty
```
- you should see something like this:
```bash
    ...
    [    0.001335] console [tty1] enabled
    [    0.277052] 3f215040.uart: ttyS0 at MMIO 0x3f215040 (irq = 59, base_baud = 31250000) is a 16550
    [    1.914340] 3f201000.uart: ttyAMA0 at MMIO 0x3f201000 (irq = 87, base_baud = 0) is a PL011 rev2
```
- where:
	- tty1: used for console output
	- __ttsS0__: serial connection we want to use
	- ttyAMA0: bluetooth
   
- set the baud rate (9600 in this case):
```bash
> sudo stty -F /dev/ttyS0 9600
```

## 3. Application Installation

### MySQL

If MySQL (v10.11) is not installed on the device, run the following:

```bash
> sudo apt-get update
> sudo apt-get install mysql-server
> sudo mysql_secure_installation
> sudo mysql_install_db
```
- check status:
```bash
> service mysql status
```
- or use:
```bash
> mysqladmin -p -u root version
```

To create a new database user, log in as root:
```bash
> mysql -u root -p
```
- at the prompt, create new user:
```bash
mysql> CREATE USER 'rpi_user'@'localhost' IDENTIFIED BY 'password'; 
```
- create a new database and then change to it:
```bash
mysql> CREATE DATABASE router_db;
mysql> use router_db;
```
- set autocommit to ON:
```bash
mysql> SET AUTOCOMMIT=1
```
- assign user to database:
```bash
mysql> GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,DROP ON router_db.* TO 'rpi_user'@'localhost';
```

### Development/Test

- For development on your PC/Mac, clone the Github repo into a local directory 
``` bash
> git clone https://github.com/team-tenacious/aece-rpi-router.git
```
- Modify the values of the following variables in the __server.js__ file in the root of the directory, eg:
```javascript
    var NODE_ENV = 'test';
    var ROUTER_PORT = '/dev/ttys008';
    var ROUTER_QUEUE_DIR = 'queue_data/.';
    var ROUTER_QUEUE_FETCH_INTERVAL = 2000;
    var ROUTER_MYSQL_HOST = 'localhost';
    var ROUTER_MYSQL_USER = 'rpi_user';
    var ROUTER_MYSQL_PASSWORD = 'password';
    var ROUTER_MYSQL_DATABASE = 'router_db';
    var ROUTER_LOG_FILE = './rpi_router.log';
```
- From the application root directory, run the following bash script to install NodeJS and the application dependencies: 
```bash
> sh install.sh
```
- If no physical connection is available to a Raspberry Pi, start a virtual serial port loop. This requires __socat__ - see also https://github.com/team-tenacious/aece-rpi-router#5-development-environment:
- __Mac__: Install __socat__ using __brew__: 
```bash
> brew install socat
```
- To run socat:
```bash
> socat -d -d pty,raw,echo=0 pty,raw,echo=0
```
    - This will set up 2 virtual ports, eg:
```bash
    2016/06/22 19:15:20 socat[2994] N PTY is /dev/ttys008
    2016/06/22 19:15:20 socat[2994] N PTY is /dev/ttys009
```
- __Windows serial emulation:
    - See [https://sourceforge.net/projects/com0com/](- __Windows__: https://sourceforge.net/projects/com0com/)
- Ensure that the relevant database tables exist in the MySQL database: 
    - see ``` /mysql_scripts/create_tables.sql ``` and run the relevant statements if required.
    
- To start the application:
```bash
> node server
``` 
- To stop:
```bash
> (ctrl-C)
```

### Production

- On the RPi, install __pm2__ (a process manager for Node - see also http://pm2.keymetrics.io/):
```bash
> npm install pm2@latest -g
```
- Clone the repo and install dependencies:
```bash 
> git clone https://github.com/team-tenacious/aece-rpi-router.git 
```
- From the root application directory, run the following bash script to install NodeJS and the application dependencies:
```bash
> sh install.sh
```
- Modify the following in the __pm2.json__ file in the root of the application: 
```javascript
...
"env": {
        "NODE_ENV": "test",
        "ROUTER_PORT": "/dev/ttyS0",
        "ROUTER_QUEUE_DIR": "queue_data/.",
        "ROUTER_QUEUE_FETCH_INTERVAL": 1000,
        "ROUTER_MYSQL_HOST": "localhost",
        "ROUTER_MYSQL_USER": "rpi_user",
        "ROUTER_MYSQL_PASSWORD": "password",
        "ROUTER_MYSQL_DATABASE": "router_db",
        "ROUTER_LOG_FILE" : "./rpi_router.log"
      }
 ...
```
- To start the application in daemon:
```bash
> pm2 start pm2.json
```

- To start the application __without__ a daemon (this will help to check for issues if the application doesn't receive messages):
```bash
> pm2 start pm2.json --no-daemon
```

- To stop:
```bash
> pm2 stop pm2.json
```

## 4. Packet/message processing

### Incoming packet processing

- parsing
    - message is received in raw (binary) format and then converted to a hex string for processing
- validation of crc
    - the hex string is then broken into it's various components and a CRC check is run. This is then compared to the incoming CRC (last 4 bytes of the hex string)
- adding to file queue
    - successfully validated messages are then placed on a file queue for later processing
- retrieval from file queue
    - files placed on the queue are retrieved (FIFO) for further processing
- storage of message on local MySQL database (with a future view of pushing to a Happner mesh)
    - files are read and the contents inserted into the relevant database table

![incoming_packet_processing](https://cloud.githubusercontent.com/assets/9947358/16415654/a18dffe0-3d3e-11e6-83fd-969c0cc0a69e.png)

### Outgoing packet processing

[TODO]

## 5. Logging

- ~~Logs are written to a logfile in the root of the application by default~~
- ~~The log file name and location can be changed in the configuration (server.js and pm2.json)~~
- ~~Only errors are written to the log~~
- Info  logs are written to the console
- Logs are now written to the Happner log

## 6. Resources:

### Socat

- http://technostuff.blogspot.co.za/2008/10/some-useful-socat-commands.html
- http://www.dest-unreach.org/socat/doc/socat.html

### MySQL database

- A local installation of MySQL (version 10.11) can be installed from here: 
    - http://dev.mysql.com/downloads/file/?id=463501 (tar)
    - http://dev.mysql.com/downloads/file/?id=463504 (dmg)
- https://github.com/mysqljs/mysql (MySql data adapter for Node)
- Follow these instructions for installation on Linux:
    - https://www.digitalocean.com/community/tutorials/how-to-install-mysql-on-ubuntu-14-04
- Create MySQL users:
    - http://dev.mysql.com/doc/refman/5.7/en/adding-users.html

### RPi serial connection / GPIO	
- https://developer.microsoft.com/en-us/windows/iot/win10/samples/pinmappingsrpi2
- http://elinux.org/RPi_Serial_Connection
- http://www.raspberrypi-spy.co.uk/2013/12/free-your-raspberry-pi-serial-port/
- http://www.instructables.com/id/Read-and-write-from-serial-port-with-Raspberry-Pi/
- https://learn.adafruit.com/adafruits-raspberry-pi-lesson-5-using-a-console-cable/connect-the-lead
- https://www.modmypi.com/download/raspberry-pi-gpio-cheat-sheet.jpg
- http://thinkingonthinking.com/serial-communication-with-nodejs/

### Protocols
- http://www.tldp.org/HOWTO/Serial-HOWTO-4.html
- http://electronics.stackexchange.com/questions/110478/difference-between-uart-and-rs232
- https://www.commfront.com/pages/3-easy-steps-to-understand-and-control-your-rs232-devices

### Node libraries for accessing serial port 	
- https://github.com/voodootikigod/node-serialport
- https://github.com/EmergingTechnologyAdvisors/node-serialport
- https://github.com/reyiyo/virtual-serialport
	    
### Hardware	
- http://unihobbies.co.za/index.php?route=product/product&product_id=54#all

### Drivers
- https://github.com/bjarnoldus/mac-osx-pl2303

### File queue for Node	
- https://github.com/threez/file-queue

## Tools

- Serial terminal for Mac: CoolTerm
- Serial terminal for Raspbian: Minicom
```
> sudo apt-get install minicom

```

## Development machine notes:

### Mac:

```bash
git clone https://github.com/team-tenacious/aece-rpi-router.git
npm install
brew install mysql
mysql.server start
```
- add user and database and tables to mysql:
```sql
mysql --user=root mysql
CREATE USER 'rpi_user'@'localhost' IDENTIFIED BY 'password';
CREATE DATABASE router_db;
USE router_db;
GRANT SELECT,INSERT,UPDATE,DELETE on router_db.* TO 'rpi_user'@'localhost';
```
- run the following scripts:
https://github.com/team-tenacious/aece-rpi-router/blob/master/mysql_scripts/create_tables.sql

```bash
brew install socat
socat -d -d pty,raw,echo=0 pty,raw,echo=0
```