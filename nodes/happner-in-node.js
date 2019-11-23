module.exports = function(RED) {
  let services = require('red-bed').Container.instance().services;
  function DataNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    services.happnerComponentService.registerInNode(node, config);
    services.happnerComponentService.on("activate-flow", function(msg) {
      try{
        node.send(msg);
      }catch(e){
        node.error(e.message, msg);
      }
    });
  }
  RED.nodes.registerType("happner-in-node", DataNode);
};
