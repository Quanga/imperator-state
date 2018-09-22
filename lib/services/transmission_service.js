var async = require('async');

function TransmissionService() {
}

TransmissionService.prototype.initialise = function ($happn, callback) {

    $happn.log.info('initialising...');

    var self = this;

    /* commands:
     0x01 - requests the ordered list of serial numbers of the connected ISC-1s
     0x02 - requests the ordered list of serial numbers of the IB651s connected to the corresponding ISC-1
     0x03 - requests the default data of the ISC-1 and IB651s
     */

    var transmit = function () {

        $happn.exchange.dataService.getIbcSerials()
            .then(function (result) {
                result.forEach(function (item) {
                    self.buildAndAddToQueue($happn, 0b00000001, item.serial);
                });
            })
            .then(function () {
                $happn.exchange.dataService.getIscSerials()
                    .then(function (serials) {

                        async.series([

                            function (cb) {
                                // iterate the isc list and create 0x02 command
                                async.eachOf(serials, function (item, pos, cb1) {
                                    self.buildAndAddToQueue($happn, 0b00000010, item.serial)
                                        .then(() => {
                                            cb1();
                                        })
                                        .catch((err) => {
                                            cb1(err);
                                        })

                                }, function (err) {
                                    if (err)
                                        return cb(err);

                                    cb();
                                })
                            },
                            function (cb) {

                                setTimeout(() => {

                                    async.eachOf(serials, function (item, pos, cb1) {
                                        // iterate the isc list and create 0x03 command (with force bit on)
                                        self.buildAndAddToQueue($happn, 0b01000011, item.serial)
                                            .then(() => {
                                                cb1();
                                            })
                                            .catch((err) => {
                                                cb1(err);
                                            })
                                    }, function (err) {
                                        if (err)
                                            return cb(err);

                                        cb();
                                    })

                                }, 5000);
                            }
                        ], function (err) {

                            if (err)
                                $happn.log.error(err);

                            setTimeout(() => {
                                transmit();
                            }, 1000);

                        });
                    })
            });
    };

    transmit();

    callback();
};

TransmissionService.prototype.buildAndAddToQueue = function ($happn, command, serial) {

    return new Promise(function (resolve, reject) {

        $happn.exchange.packetService.buildOutgoingPacket(command, serial)
            .then(function (result) {
                $happn.log.info('adding message to outgoing queue...: ', result);

                $happn.exchange.queueService.addToOutgoingQueue(result)
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        $happn.log.error('buildAndSend error 2', err);
                        return reject(err);
                    })
            })
            .catch(function (err) {
                $happn.log.error('buildAndSend error 1', err);
                return reject(err);
            })
    });
};

module.exports = TransmissionService;
