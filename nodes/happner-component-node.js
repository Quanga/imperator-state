module.exports = function(RED) {
  let services = require('red-bed').Container.instance().services;
  function DataNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    node.on('input', function(msg) {
      try{
        let componentName = msg.payload.component || config.component;
        let methodName = msg.payload.method || config.method;
        if (!msg.payload.arguments) msg.payload.arguments = [];
        if (!services.happnerComponentService.$happn.exchange[componentName])
          throw new Error(`component ${componentName} does not exist on the exchange`);
        if (!services.happnerComponentService.$happn.exchange[componentName][methodName])
          throw new Error(`component method ${componentName}::${methodName} does not exist on the exchange`);
        let args = msg.payload.arguments.slice();
        args.push((e, result) => {
          if (e) return node.error(e.message, msg);
          if (!msg.payload) msg.payload = {};
          msg.payload[`${componentName}::${methodName}`] = result;
          node.send(msg);
        });
        services.happnerComponentService.$happn.exchange[componentName][methodName].apply(services.happnerComponentService.$happn, args);
      }catch(e){
        node.error(e.message, msg);
      }
    });
  }
  RED.nodes.registerType("happner-component-node", DataNode);
};
