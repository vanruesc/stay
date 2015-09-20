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

### The server part

> Any resource that your web application serves has to be available as a condensed json resource for Stay to work. This includes all kinds of error pages. If your URIs are well organised, this will be easy. If not, be prepared for a big cleanup!

Take a look at some best practices for URI design first, if you haven't already. [These guidelines](https://css-tricks.com/guidelines-for-uri-design/) are a good start.

Stay is rather tolerant when it comes to different URI patterns, but to illustrate what's going on behind the scenes let's take a look at the following example. Stay will grab a URI like this one:

```html
<a href="/fish/salmon">Salmon</a>
```

and internally convert it to:

```javascript
"http://www.your-domain.com:port/json/fish/salmon"
```

This URI won't be seen by the user and the infix can freely be chosen by you. However, "/json" makes the most sense here since the server will have to respond with a json resource after all.

If we assume that the original URI points to a simple html page which looks like this:

```html
<html>
	<head>
		<meta charset="utf-8">
		<title>Salmon</title>
	</head>
	<body>
		<div id="main">Fishy!</div>
	</body>
</html>
```

then the the server response to the request made by Stay has to look like this:

```javascript
{
    "meta": {
        "title": "Salmon"
    },
    "main": "Fishy!"
}
```

Stay will then replace the children of ```#main``` with the received content which is the simple text node ```"Fishy!"``` in this case. Stay will adjust the current page's title and manage the browser history for you to support the back and forward user actions. Although the above example html is minimal, you can already see the advantage of asynchronous (and well organised) web applications; only the essential page content travels through the nether! The most important benefits are:

1. Less bandwidth usage
2. Better performance
3. More control over navigation
4. Backwards compatibility for users that block JavaScript
