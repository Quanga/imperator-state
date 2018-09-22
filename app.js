/**
 * Created by grant on 2016/06/27.
 */

function App() {}

App.prototype.start = function ($happn, callback) {
    $happn.log.info("READY!");


    var quit = function (err) {
        process.exit(err.code || 1);
    };

    $happn.exchange.queueService.initialise()
        .then(() => {
            return $happn.exchange.portService.initialise();
        })
        .then(() => {
            $happn.log.info("READY!");
            callback();

        })
      

        .then(function(){
            return $happn.exchange.packetRepository.initialise()
        })
        .then(function(){
            return $happn.exchange.nodeRepository.initialise()
        })
    .then(function () {
        return $happn.exchange.queueService.watchIncomingQueue();
    })
        .then(function () {
            return $happn.exchange.queueService.watchOutgoingQueue();
        })
        .then(function () {
            $happn.exchange.transmissionService.initialise();
        })
    //     .then(function () {
    //         return $happn.exchange.packetSimulatorService.initialise();
    //     })
    // .then(function () {
    //     $happn.log.info("READY!");
    //     callback();
    // });
    .catch((err) => {
        $happn.log.error('start error', err);
        callback(err);
        quit(err);
    });;



};



module.exports = App;