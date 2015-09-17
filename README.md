# Stay 
[![Build status](https://travis-ci.org/vanruesc/stay.svg?branch=master)](https://travis-ci.org/vanruesc/stay) 
[![Windows build status](https://ci.appveyor.com/api/projects/status/7ojob52ctrwywgib?svg=true)](https://ci.appveyor.com/project/vanruesc/stay) 
[![GitHub version](https://badge.fury.io/gh/vanruesc%2Fstay.svg)](http://badge.fury.io/gh/vanruesc%2Fstay) 
[![npm version](https://badge.fury.io/js/%40zayesh%2Fstay.svg)](http://badge.fury.io/js/%40zayesh%2Fstay) 
[![Dependencies](https://david-dm.org/vanruesc/stay.svg?branch=master)](https://david-dm.org/vanruesc/stay)

Stay is a small but effective module for the creation of dynamic xhr-driven web applications. 
It expects the server to be able to send the page content as a JSON string in which the key names 
correspond with the IDs of the target DOM containers.

## Installation

Download the [minified library](http://vanruesc.github.io/stay/build/stay.min.js) and include it in your project:

```html
<script src="/js/stay.min.js"></script>
```

You can also install this module with [npm](https://www.npmjs.com).

```sh
$ npm install @zayesh/stay
``` 

## Usage

```javascript
import Stay from "@zayesh/stay";

var stay = new Stay({

	// Logs to console by default
	stderr: "myDomElement",

	// Default is "/json"
	infix: "/urlPatternForAsyncRequests",

	// Default is 60000ms, 0 means no timeout
	timeoutPost: 0,

	// Default is 5000ms
	timeoutGet: 0,

	// Default is true
	autoUpdate: false

});

stay.addEventListener("navigate", function() {

	alert("Page navigation has started.");

});

stay.addEventListener("receive", function(event) {

	/* If autoUpdate is set to false, the programmer can 
	 * decide when to update the page content.
	 * The response is the parsed JSON string from the server.
	 */

	stay.update(event.response);

});

stay.addEventListener("load", function() {

	alert("The requested page has been loaded.");

});
```

## Documentation
[API](http://vanruesc.github.io/stay/docs)

## Contributing
Maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.

## Release History
_Version: 0.0.0 (28.06.2015)_
> The module realises a robust xhr-driven page navigation.

## License
Copyright (c) 2015 Raoul van Rüschen  
Licensed under the Zlib license.
