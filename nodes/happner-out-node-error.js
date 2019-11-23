module.exports = function(RED) {
  function DataNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    node.on('input', function(msg) {
      try{
        let error = new Error(msg.error.message);
        error.nodered = msg.error;
        msg.callback(error);
      }catch(e){
        msg.callback(e);
      }
    });
  }
  RED.nodes.registerType("happner-out-node-error", DataNode);
};
