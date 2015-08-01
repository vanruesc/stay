/**
 * stay v0.0.15 build 01.08.2015
 * https://github.com/vanruesc/stay
 * Copyright 2015 Raoul van Rueschen, Apache-2.0
 */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Stay = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/**
 * Event Dispatcher.
 * A base class for adding and removing event listeners and dispatching events.
 *
 * @constructor
 */

function EventDispatcher()
{
 this._listeners = {};
}

/**
 * Adds an event listener.
 *
 * @param {string} type - The event type.
 * @param {function} listener - The event listener.
 */

EventDispatcher.prototype.addEventListener = function(type, listener)
{
 if(this._listeners[type] === undefined)
 {
  this._listeners[type] = [];
 }

 if(this._listeners[type].indexOf(listener) === -1)
 {
  this._listeners[type].push(listener);
 }
};

/**
 * Checks if the event listener exists.
 *
 * @param {string} type - The event type.
 * @param {function} listener - The event listener.
 */

EventDispatcher.prototype.hasEventListener = function(type, listener)
{
 return(this._listeners[type] !== undefined && this._listeners[type].indexOf(listener) !== -1);
};

/**
 * Removes an event listener.
 *
 * @param {string} type - The event type.
 * @param {function} listener - The event listener.
 */

EventDispatcher.prototype.removeEventListener = function(type, listener)
{
 var i, listeners = this._listeners,
  listenerArray = listeners[type];

 if(listenerArray !== undefined)
 {
  i = listenerArray.indexOf(listener);

  if(i !== -1)
  {
   listenerArray.splice(i, 1);
  }
 }
};

/**
 * Dispatches an event to all respective listeners.
 *
 * @param {Object} event - The event.
 */

EventDispatcher.prototype.dispatchEvent = function(event)
{
 var i, l, listeners = this._listeners,
  listenerArray = listeners[event.type];

 if(listenerArray !== undefined)
 {
  event.target = this;

  for(i = 0, l = listenerArray.length; i < l; ++i)
  {
   listenerArray[i].call(this, event);
  }
 }
};

module.exports = EventDispatcher;

},{}],2:[function(require,module,exports){
"use strict";

module.exports = Stay;

var EventDispatcher = require("@zayesh/eventdispatcher");

/**
 * Use the native browser url parsing mechanism
 * to retrieve the parts of a url.
 *
 * @method getUrlParts
 * @private
 * @static
 * @param {String} url - The URL to parse.
 * @return {HTMLAnchorElement} An object containing the url parts.
 */

function getUrlParts(url)
{
 var a = document.createElement("a");
 a.href = url;
 return a;
}

/**
 * The Stay XHR System.
 *
 * Used for requesting page content asynchronously
 * while staying on the same page.
 *
 * Each request can have a hard timeout to avoid endless
 * loading times that are often deemed to fail anyways.
 *
 * @class Stay
 * @constructor
 * @extends EventDispatcher
 * @throws {Error} An error is thrown if asynchronous requests are not supported.
 * @param {Object} [options] - The options.
 * @param {Array} [options.responseFields=["main", "navigation", "footer"]] - The content container IDs. These have to be the same as the data fields in the server response.
 * @param {String} [options.infix="/json"] - The special url pattern infix for the asynchronous content requests.
 * @param {Number} [options.timeoutPost=60000] - Hard timeout for POST. 0 means no timeout.
 * @param {Number} [options.timeoutGet=5000] - Hard timeout for GET. 0 means no timeout.
 * @param {Boolean} [options.autoUpdate=true] - Whether Stay should automatically update the page content.
 */

function Stay(options)
{
 var self = this;

 EventDispatcher.call(this);

 /**
  * Regular expression to check if a url is local.
  *
  * @property local
  * @type RegExp
  * @private
  */

 this.local = new RegExp("^" + location.protocol + "//" + location.host);

 /**
  * The response fields are the IDs of the DOM elements
  * that need to be filled with the server response fields.
  *
  * @property responseFields
  * @type Array
  */

 this.responseFields = ["main", "navigation", "footer"];

 /**
  * The infix to use for the asynchronous requests.
  *
  * @property infix
  * @type String
  */

 this.infix = "/json";

 /**
  * POST timeout.
  *
  * @property timeoutPost
  * @type Number
  */

 this.timeoutPost = 60000;

 /**
  * GET timeout.
  *
  * @property timeoutGet
  * @type Number
  */

 this.timeoutGet = 5000;

 /**
  * Auto update flag.
  *
  * @property autoUpdate
  * @type Boolean
  */

 this.autoUpdate = true;

 // Overwrite default values.
 if(options !== undefined)
 {
  if(options.responseFields !== undefined) { this.responseFields = options.responseFields; }
  if(options.infix !== undefined) { this.infix = options.infix; }
  if(options.timeoutPost !== undefined) { this.timeoutPost = options.timeoutPost; }
  if(options.timeoutGet !== undefined) { this.timeoutGet = options.timeoutGet; }
  if(options.autoUpdate !== undefined) { this.autoUpdate = options.autoUpdate; }
 }

 /**
  * Lock flag.
  *
  * @property locked
  * @type Boolean
  * @private
  */

 this.locked = false;

 /**
  * Back-forward flag.
  *
  * @property backForward
  * @type Boolean
  * @private
  */

 this.backForward = false;

 /**
  * The current absolute path.
  *
  * @property absolutePath
  * @type String
  * @private
  */

 this.absolutePath = null;

 /**
  * A list of references to the response field DOM elements.
  *
  * @property containers
  * @type Array
  * @private
  */

 this.containers = [];

 /**
  * A container which is filled by setting its innerHTML.
  * The created DOM elements are taken from this container
  * and appended to the response fields.
  *
  * @property intermediateContainer
  * @type HTMLDivElement
  * @private
  */

 this.intermediateContainer = null;

 /**
  * A list of navigation listeners for unbinding.
  *
  * @property navigationListeners
  * @type Array
  * @private
  */

 this.navigationListeners = [];

 /**
  * Signalises that a page navigation has started.
  *
  * @event navigate
  */

 this.eventNavigate = {type: "navigate"};

 /**
  * Returns the parsed server response.
  *
  * @event receive
  * @param {Object} response - The server response, ready to be inserted into the respective response fields.
  * @param {number} status - The status of the xhr response.
  */

 this.eventReceive = {type: "receive", response: null, status: 0};

 /**
  * Signalises that a page update has finished.
  *
  * @event load
  */

 this.eventLoad = {type: "load"};

 /**
  * The internal XMLHttpRequest instance.
  *
  * @property xhr
  * @type XMLHttpRequest
  * @private
  */

 if(XMLHttpRequest !== undefined)
 {
  this.xhr = new XMLHttpRequest();
 }
 else
 {
  throw new Error("XMLHttpRequest functionality not available.");
 }

 /**
  * Triggers the internal response handler.
  *
  * @method handleResponse
  * @private
  * @param {Object} event - The event.
  */

 this.xhr.addEventListener("readystatechange", function handleResponse(event) { self._handleResponse(this, event); });

 /**
  * Handles xhr timeouts, ignores the event object.
  *
  * @method handleTimeout
  * @private
  */

 this.xhr.addEventListener("timeout", function handleTimeout()
 {
  var response = {};

  if(self.responseFields.length)
  {
   response.title = "Timeout Error";
   response[self.responseFields[0]] = Stay.Error.TIMEOUT;
   self.locked = true;
   self.update(response);
  }
 });

 /**
  * Support browser functionality "back" and "forward".
  * Depends on the boolean variable "locked" in order to
  * determine whether this navigation should be executed.
  * The "backForward" flag tells the system that the next
  * state mustn't be pushed.
  *
  * @method handleBackForward
  * @private
  * @param {Object} event - The event.
  */

 window.addEventListener("popstate", function handleBackForward(event)
 {
  if(!self.locked && event.state !== null)
  {
   self.backForward = true;
   self._navigate({href: event.state.url});
  }
 });

 /**
  * This function is bound to all links and forms
  * and executes the desired page navigation on left clicks.
  *
  * @method _switchPage
  * @private
  * @param {Event} event - The event.
  */

 this._switchPage = function(event)
 {
  var preventable = (event.preventDefault !== undefined),
   proceed = false;

  if(event.type === "submit")
  {
   proceed = true;
  }
  else if(!event.metaKey && !event.shiftKey && !event.altKey && !event.ctrlKey)
  {
   if(event.which !== undefined)
   {
    proceed = event.which === 1;
   }
   else if(event.button !== undefined)
   {
    proceed = event.button === 0;
   }
  }

  if(proceed)
  {
   if(preventable) { event.preventDefault(); }
   if(!self.locked) { self._navigate(this); }
  }

  // Only return false if it was a left click, but the default behaviour couldn't be prevented.
  return !(proceed && !preventable);
 };

 // Indirectly push the initial state.
 this.update({
  title: document.title,
  url: window.location.href
 });

 // Start the system by binding all event handlers.
 this._updateListeners();
}

Stay.prototype = Object.create(EventDispatcher.prototype);
Stay.prototype.constructor = Stay;

/**
 * Adds a response field.
 *
 * @method addResponseField
 * @param {string} field - The field to add.
 */

Stay.prototype.addResponseField = function(field)
{
 if(this.responseFields.indexOf(field) === -1)
 {
  this.responseFields.push(field);
 }
};

/**
 * Removes a response field.
 *
 * @method removeResponseField
 * @param {string} field - The field to remove.
 */

Stay.prototype.removeResponseField = function(field)
{
 var i = this.responseFields.indexOf(field);

 if(i !== -1)
 {
  this.responseFields.splice(i, 1);
 }
};

/**
 * Navigates to the next target uri.
 *
 * @method _navigate
 * @private
 * @param {HTMLElement} firingElement - The element on which the click event occured.
 */

Stay.prototype._navigate = function(firingElement)
{
 var formData, pathname, url, post = false;

 this.locked = true;

 if(firingElement.action)
 {
  // Collect form data if the firing element is a form.
  this.absolutePath = firingElement.action;
  formData = new FormData(firingElement);
  post = true;
 }
 else
 {
  this.absolutePath = firingElement.href;
 }

 pathname = getUrlParts(this.absolutePath).pathname;
 if(pathname.charAt(0) !== "/") { pathname = "/" + pathname; }

 // Special treatment for the index page.
 url = (pathname === "/") ?
  this.absolutePath.slice(0, this.absolutePath.length - 1) + this.infix + pathname :
  this.absolutePath.replace(new RegExp(pathname), this.infix + pathname);

 this.eventNavigate.method = post ? "POST" : "GET";
 this.dispatchEvent(this.eventNavigate);
 this.xhr.open(this.eventNavigate.method, url, true);

 if(post)
 {
  this.xhr.timeout = this.timeoutPost;
  this.xhr.send(formData);
 }
 else
 {
  this.xhr.timeout = this.timeoutGet;
  this.xhr.send();
 }
};

/**
 * Updates the containers with the new data.
 *
 * @method _updateView
 * @private
 * @param {object} response - The response to display. Assumed to contain the data fields specified in "responseFields".
 */

Stay.prototype._updateView = function(response)
{
 var i, l, c, r, contentChanged = false;

 if(this.intermediateContainer === null)
 {
  this.intermediateContainer = document.createElement("div");
 }
 else
 {
  // Clear the intermediate container.
  while(this.intermediateContainer.children.length > 0)
  {
   this.intermediateContainer.removeChild(this.intermediateContainer.children[0]);
  }
 }

 for(i = 0, l = this.responseFields.length; i < l; ++i)
 {
  c = this.containers[this.responseFields[i]];

  if(!c)
  {
   // No reference exists yet. Find the element and remember it.
   c = this.containers[this.responseFields[i]] = document.getElementById(this.responseFields[i]);
  }

  r = response[this.responseFields[i]];

  if(r)
  {
   while(c.children.length > 0)
   {
    c.removeChild(c.children[0]);
   }

   // Let the browser create the DOM elements from the html string.
   this.intermediateContainer.innerHTML = r;

   // Add them one after another.
   while(this.intermediateContainer.children.length > 0)
   {
    c.appendChild(this.intermediateContainer.children[0]);
   }

   contentChanged = true;
  }
 }

 if(contentChanged)
 {
  this._updateListeners();
 }
};

/**
 * Binds event listeners to all links and forms.
 * This method is combined with the cleanup and basically refreshes 
 * the navigation listeners.
 *
 * @method _updateListeners
 * @private
 */

Stay.prototype._updateListeners = function()
{
 var self = this, i, l,
  links = document.getElementsByTagName("a"),
  forms = document.getElementsByTagName("form");

 for(i = 0, l = this.navigationListeners.length; i < l; ++i)
 {
  this.navigationListeners[i][0].removeEventListener(this.navigationListeners[i][1], self._switchPage);
 }

 for(i = 0, l = links.length; i < l; ++i)
 {
  if(this.local.test(links[i].href))
  {
   links[i].addEventListener("click", self._switchPage);
   this.navigationListeners.push([links[i], "click"]);
  }
 }

 for(i = 0, l = forms.length; i < l; ++i)
 {
  if(this.local.test(forms[i].action))
  {
   forms[i].addEventListener("submit", self._switchPage);
   this.navigationListeners.push([forms[i], "submit"]);
  }
 }
};

/**
 * Updates the view, the navigation listeners and the history state.
 * Also emits an event to signilize that the page has been loaded.
 *
 * The update function needs to be called after each navigation in 
 * order to unlock the system. This happens by default, but that
 * behaviour can be disabled. It is then the responsibility of the
 * programmer to call stay.update() with the response data provided 
 * by the "receive" event.
 *
 * @method update
 * @param {object} response - The response to display.
 */

Stay.prototype.update = function(response)
{
 this._updateView(response);
 document.title = response.title;

 if(response.url)
 {
  this.absolutePath = response.url.replace(this.infix, "");
 }

 if(!this.backForward)
 {
  history.pushState({url: this.absolutePath}, response.title, this.absolutePath);
 }
 else
 {
  this.backForward = false;
 }

 this.eventReceive.response = null;
 this.dispatchEvent(this.eventLoad);
 this.locked = false;
};

/**
 * This function acts when the xhr object changes its readyState.
 * The response will be a json object or an error page. Anything else will 
 * be caught as a json parse exception and announced in the first response field.
 *
 * @method _handleResponse
 * @private
 * @param {XMLHttpRequest} xhr - The xhr object that fired the event.
 */

Stay.prototype._handleResponse = function(xhr)
{
 var response = {};

 if(this.responseFields.length === 0)
 {
  response.title = "Setup Error";
  response[this.responseFields[0]] = Stay.Error.NO_RESPONSE_FIELDS;
 }
 else if(xhr.readyState === 4)
 {
  try
  {
   response = JSON.parse(xhr.responseText);
  }
  catch(e)
  {
   response.title = "Parse Error";
   response[this.responseFields[0]] = Stay.Error.UNPARSABLE;
   if(console !== undefined) { console.log(e); }
  }

  response.url = xhr.responseURL;
  this.eventReceive.status = xhr.status;
  this.eventReceive.response = response;
  this.dispatchEvent(this.eventReceive);

  if(this.autoUpdate)
  {
   this.update(response);
  }
 }
};

/**
 * Enumeration of Error Messages.
 *
 * @property Error
 * @type Object
 * @private
 * @static
 * @final
 */

Stay.Error = Object.freeze({
 TIMEOUT: "<p>The server didn't respond in time. Please try again later!</p>",
 UNPARSABLE: "<p>The received content could not be parsed.</p>",
 NO_RESPONSE_FIELDS: "<p>No response fields have been specified!</p>"
});

},{"@zayesh/eventdispatcher":1}]},{},[2])(2)
});