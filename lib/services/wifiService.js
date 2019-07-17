/* eslint-disable no-unused-vars */

const isPi = require("detect-rpi");

function WifiService() {}

WifiService.prototype.start = function($happn) {
	const { log } = $happn;
	const { wifiService } = $happn.exchange;
	return (async () => {
		if (isPi()) {
			log.info("WirelessService is starting");
			//await wifiService.enableAP();
		} else {
			log.info("Not running on edge device, wifi service not running");
		}
		//await this.enableAP();
	})();
};

WifiService.prototype.enableAP = function($happn, options) {
	const hostapd = require("wireless-tools/hostapd");
	const udhcpc = require("wireless-tools/udhcpc");
	const udhcpd = require("wireless-tools/udhcpd");

	const { log } = $happn;

	return new Promise(resolve => {
		const dhcp = {
			interface: "wlan0"
		};

		udhcpc.enable(dhcp, function(err) {
			// the dhcp client was started
		});

		var ud = {
			interface: "wlan0",
			start: "192.168.10.100",
			end: "192.168.10.200",
			option: {
				router: "192.168.10.1",
				subnet: "255.255.255.0",
				dns: ["4.4.4.4", "8.8.8.8"]
			}
		};

		udhcpd.enable(ud, function(err) {
			// the dhcp server was started
		});

		const host = {
			channel: 6,
			driver: "rtl871xdrv",
			hw_mode: "g",
			interface: "wlan0",
			ssid: "RaspberryPi",
			wpa: 2,
			wpa_passphrase: "raspberry"
		};

		hostapd.enable(host, function(err) {
			if (err) {
				log.error("Cannot create AP", err);
				return resolve();
			}
			resolve("AP Created");
		});
	});
};

module.exports = WifiService;
