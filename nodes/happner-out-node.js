module.exports = function(RED) {
  function DataNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    node.on('input', function(msg) {
      try{
        if (msg.error) return;//should be handled by the out error
        if (!msg.callback) throw new Error('no callback defined for happner-out-node');
        msg.callback(null, msg.payload);
      }catch(e){
        msg.callback(e);
      }
    });
  }
  RED.nodes.registerType("happner-out-node", DataNode);
};
