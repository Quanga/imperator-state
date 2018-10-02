import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";

class App extends Component {
	render() {
		//var Happner = require("happner-client");

		//var client = new Happner.MeshClient({ secure: false, port: 55000 });
		return (
			<div className="App">
				<header className="App-header">
					<img src={logo} className="App-logo" alt="logo" />
					<h1 className="App-title">Welcome to React</h1>
				</header>
				<p className="App-intro">
					To get started, edit <code>src/App.js</code> and save to reload.
				</p>
			</div>
		);
	}

	componentDidMount() {
		const script = document.createElement("script");

		script.src = "/api/client";

		script.async = true;
		//var client = new MeshClient /* options */();
		document.body.appendChild(script);
		//const scriptb = document.createElement("script");
	}
}

export default App;
