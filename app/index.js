
var client = new window.MeshClient(/* {host:,port:} */);

client.login(/* {username:, password:} */)

	.then(function () {

		// Call the world() function from node_modules/hello/index.js
		return client.exchange.hello.world({/*opts*/ }, function (error, greeting) {

			alert(greeting);

			// Note: The same function is available on a path that includes
			//       the MeshNode's name:
			//
			// mesh.exchange.myMeshNode.hello.world(...
			//
		});

	});