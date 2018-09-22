/**
 * Created by grant on 2016/06/22.
 */

function SerialPortService() {}

SerialPortService.prototype.initialise = function ($happn) {
    var self = this;
    $happn.log.info('initialising Serial Port Service...');

    var getSerialPortInstance = () => {
        return new Promise((resolve, reject) => {
            try {
                const inst = $happn.exchange.portUtil.getInstance();
                resolve(inst);
            } catch (err) {
                $happn.log.error('Could not get Port Instance', err);
                reject(err);
            }
        });
    };

    var attachMessageReceiveHandler = (port) => {
        return new Promise((resolve, reject) => {
            try {
                $happn.exchange.messageHandler.createMessageReceiveHandler()
                    .then((handler) => {
                        port.on("data", handler);
                        resolve();
                    })
            } catch (err) {
                $happn.log.error('Could not attach Message Handler', err);
                reject(err);
            }
        });
    }

      
    return new Promise((resolve, reject) => {
        getSerialPortInstance()
            .then(function (p) {
                attachMessageReceiveHandler(p)
            })
            .then(
                resolve()
            )
            .catch((err) => {
                $happn.log.error('initialize error 1', err);
                reject(err);
            });
    });
};


SerialPortService.prototype.sendMessage = function ($happn, message, callback) {
    //$happn.log.info('writing to port......');

    $happn.exchange.portUtil.getInstance()
        .then(function (port) {

            //$happn.log.info('outgoing message: ' + message);
            var buf = new Buffer(message); // message is an array

            port.write(buf, function (err) {
                if (err) {
                    $happn.log.error('sendMessage error 2', err);
                    callback(err);
                } else {
                    //$happn.log.info('message sent');
                    callback();
                }
            });

            // TODO: this callback should be removed, but there seems to be an issue where the callback from
            // port.write is not being returned...
            //callback();
        })
        .catch(function (err) {
            $happn.log.error('sendMessage error 1', err);
            callback(err);
        });
};

module.exports = SerialPortService;