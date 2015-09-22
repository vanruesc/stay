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

### The client part

```javascript
import Stay from "@zayesh/stay";

var stay = new Stay({

	// Logs to console by default
	stderr: "myDomElement",

	// Default is "/json"
	infix: "/asyncRequests",

	// Default is 60000ms, 0 means no timeout
	timeoutPost: 0,

	// Default is 5000ms
	timeoutGet: 0,

	// Default is true
	autoUpdate: false

});

stay.addEventListener("navigate", function() {

	console.log("Page navigation has started.");

});

stay.addEventListener("receive", function(event) {

	/* If autoUpdate is disabled, the programmer has to decide 
	 * when to update the page content. The update() method MUST 
	 * be called at some point to unlock the system!
	 */

	stay.update(event.response);

});

stay.addEventListener("load", function() {

	console.log("The requested page has been loaded.");

});
```

### The server part

> Every REST endpoint (at least GET, POST) has to be available as a condensed JSON resource. 
> This includes dynamically generated pages and error pages. Serving a JSON version of each resource
> should always be seen as an additional feature and nothing more. You should make good use of
> JavaScript, but you shouldn't depend on it. Don't lock out users who disable JavaScript.

Stay is rather tolerant when it comes to different URI patterns, but a well-structured 
URI configuration is the foundation of a good web application. Take a look at some 
recommendations for good URI design if you haven't already! 
[These guidelines](https://css-tricks.com/guidelines-for-uri-design/) are a good starting point.

The following example shows what's going on behind the scenes of Stay:

```html
<a href="/foo/bar">Hyperlink</a>
```

This link will internally be converted to:

```javascript
"http[s]://www.your-domain.com[:port]/json/foo/bar"
```

The modified URI won't be seen by the user and the infix can be freely chosen by you. 
If we assume that the original URI points to a simple HTML page which looks like this:

```html
<html>
	<head>
		<meta charset="utf-8">
		<title>Foo</title>
	</head>
	<body>
		<div id="main">Bar!</div>
	</body>
</html>
```

then the JSON equivalent must look like this:

```javascript
{
    "meta": {
        "title": "Foo"
    },
    "main": "Bar!"
}
```

Stay will replace the current children of ```#main``` with the received content which is a simple text 
node in this case, but could be any HTML content. The current page's title will also be adjusted and 
the browser history will be managed for you to support the back and forward browser controls. 
Although the above example HTML is minimal, it highlights the main aspects of asynchronous web applications:

- More efficient bandwidth usage
- Better loading performance
- More control over the navigation process
- Consolidation of a main page structure
- Still highly customisable!


## External Resources

Stay detects external resources and doesn't touch them.


## Other Resources

Resources like images or executable files are problematic because they can't be identified as such by their URI alone. 
When linking a resource that can't be represented in JSON format, you should consider moving it on a dedicated file server. 
Since Stay ignores external resources, the file will open as expected.


## Documentation
[API](http://vanruesc.github.io/stay/docs)


## Contributing
Maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.


## License
Copyright (c) 2015 Raoul van Rüschen  
Licensed under the Apache 2.0 license.
