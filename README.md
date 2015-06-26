# Stay  [![Build Status](https://travis-ci.org/vanruesc/stay.svg?branch=master)](https://travis-ci.org/vanruesc/stay) [![GitHub version](https://badge.fury.io/gh/vanruesc%2Fstay.svg)](http://badge.fury.io/gh/vanruesc%2Fstay) [![Dependencies](https://david-dm.org/vanruesc/stay.svg?branch=master)](https://david-dm.org/vanruesc/stay)

Stay is a small but effective library for the creation of dynamic xhr-driven web applications.

## Usage

Download the [minified library](http://vanruesc.github.io/stay/build/stay.min.js) and include it in your project:

```html
<script src="/js/stay.min.js"></script>
```

Then use the library as follows:

```javascript
var stay = new Stay({
 /* Default is ["content", "navigation"] */
 responseFields: ["myContent", "myNavigation", "myFooter"],
 /* Default is "/json" */
 infix: "/urlPatternForAsyncRequests",
 /* Default is 60000ms, 0 means no timeout */
 timeoutPost: 0,
 /* Default is 5000ms */
 timeoutGet: 0
});

stay.addEventListener("navigate", function()
{
 alert("Page navigation has started.");
});

stay.addEventListener("load", function()
{
 alert("The requested page has been loaded.");
});
```

## Contributing
Maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.

## Release History
No release yet.

## License
Copyright (c) 2015 Raoul van Rüschen  
Licensed under the Zlib license.
