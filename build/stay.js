/**
 * stay build 26.06.2015
 *
 * Copyright 2015 Raoul van Rueschen
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Stay = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/**
 * Event Dispatcher.
 *
 * A base class for adding and removing event listeners and dispatching events.
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
 var listeners = this._listeners;

 if(listeners[type] === undefined)
 {
  listeners[type] = [];
 }

 if(listeners[type].indexOf(listener) === -1)
 {
  listeners[type].push(listener);
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
 var listeners = this._listeners;
 return(listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1);
};

/**
 * Removes an event listener.
 *
 * @param {string} type - The event type.
 * @param {function} listener - The event listener.
 */

EventDispatcher.prototype.removeEventListener = function(type, listener)
{
 var listeners = this._listeners,
  listenerArray = listeners[type],
  index;

 if(listenerArray !== undefined)
 {
  index = listenerArray.indexOf(listener);

  if(index !== -1)
  {
   listenerArray.splice(index, 1);
  }
 }
};

/**
 * Dispatches an event to all respective listeners.
 *
 * @param {Event} event - The event.
 */

EventDispatcher.prototype.dispatchEvent = function(event)
{
 var listeners = this._listeners,
  listenerArray = listeners[event.type],
  array, length, i;

 if(listenerArray !== undefined)
 {
  event.target = this;
  array = [];
  length = listenerArray.length;

  for(i = 0; i < length; ++i)
  {
   array[i] = listenerArray[i];
  }

  for(i = 0; i < length; ++i)
  {
   array[i].call(this, event);
  }
 }
};

module.exports = EventDispatcher;

},{}],2:[function(require,module,exports){
"use strict";

var EventDispatcher = require("./eventdispatcher"),
 index = "/";

/**
 * Use the native browser url parsing mechanism
 * to retrieve the parts of a url.
 *
 * @param {string} url - The URL to parse.
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
 * @param {Object} options - The options.
 */

function Stay(options)
{
 var self = this;

 EventDispatcher.call(this);

 this.responseFields = ["content", "navigation"];
 this.infix = "/json";
 this.timeoutPost = 60000;
 this.timeoutGet = 5000;

 if(options !== undefined)
 {
  if(options.responseFields !== undefined) { this.responseFields = options.responseFields; }
  if(options.infix !== undefined) { this.infix = options.infix; }
  if(options.timeoutPost !== undefined) { this.timeoutPost = options.timeoutPost; }
  if(options.timeoutGet !== undefined) { this.timeoutGet = options.timeoutGet; }
 }

 this.locked = false;
 this.backForward = false;
 this.absolutePath = null;
 this.containers = [];
 this.intermediateContainer = null;
 this.navigationListeners = [];
 this.eventNavigate = {type: "navigate"};
 this.eventLoad = {type: "load"};

 this.xhr = new XMLHttpRequest();
 this.xhr.addEventListener("readystatechange", function(event) { self.handleResponse(this, event); });
 this.xhr.addEventListener("timeout", function()
 {
  self.locked = true;
  self.update({
   title: "Timeout Error",
   contents: Stay.Error.TIMEOUT
  });
 });

 /**
  * Support browser functionality "back" and "forward".
  * Depends on the boolean variable "locked" in order to
  * determine whether this navigation should be executed.
  * The "backForward" flag tells the system that the next
  * state mustn't be pushed.
  *
  * @param {Event} event - The event, dispatched by window.
  */

 window.addEventListener("popstate", function(event)
 {
  if(!self.locked && event.state !== null)
  {
   self.backForward = true;
   self.navigate({href: event.state.url});
  }
 });

 /**
  * This function is bound to all links and forms
  * and executes the desired page navigation on left clicks.
  *
  * @param {HTMLElement} element - The element that dispatched the event.
  * @param {Event} event - The event.
  */

 this.switchPage = function(event)
 {
  var preventable = (event.preventDefault !== undefined),
   proceed = false;

  if(event.type === "submit")
  {
   proceed = true;
  }
  else if(!event.metaKey && !event.shiftKey && !event.altKey && !event.ctrlKey)
  {
   if(event.buttons !== undefined)
   {
    proceed = event.buttons === 0;
   }
   else if(event.which !== undefined)
   {
    proceed = event.which === 1;
   }
   else if(event.button !== undefined)
   {
    proceed = event.button === 0;
   }
   else if(event.keyCode !== undefined)
   {
    proceed = event.keyCode === 0;
   }
  }

  if(proceed)
  {
   if(preventable) { event.preventDefault(); }
   if(!self.locked) { self.navigate(this); }
  }

  // Only return false if it was a left click, but the default behaviour couldn't be prevented.
  return !(proceed && !preventable);
 };

 this.updateListeners();
}

Stay.prototype = Object.create(EventDispatcher.prototype);
Stay.prototype.constructor = Stay;

/**
 * Navigates to the next target uri.
 *
 * @param {HTMLElement} firingElement - The element on which the click event occured.
 */

Stay.prototype.navigate = function(firingElement)
{
 var formData, parts, url;

 if(firingElement.action)
 {
  // Collect form data if the firing element is a form.
  this.absolutePath = firingElement.action;
  formData = new FormData(firingElement);
 }
 else
 {
  this.absolutePath = firingElement.href;
 }

 parts = getUrlParts(this.absolutePath);
 this.locked = true;

 // Special treatment for the index page.
 url = (parts.pathname === index) ?
  this.absolutePath.slice(0, this.absolutePath.length - 1) + this.infix + parts.pathname :
  this.absolutePath.replace(parts.pathname, this.infix + parts.pathname);

 this.dispatchEvent(this.eventNavigate);

 if(formData)
 {
  this.xhr.open("POST", url, true);
  this.xhr.timeout = this.timeoutPost;
  this.xhr.send(formData);
 }
 else
 {
  this.xhr.open("GET", url, true);
  this.xhr.timeout = this.timeoutGet;
  this.xhr.send();
 }
};

/**
 * Updates the containers with the new data.
 *
 * @param {object} response - The response to display. Assumed to contain the data fields specified in "responseFields".
 */

Stay.prototype.updateView = function(response)
{
 var i, l, c, r;

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
  }
 }
};

/**
 * Binds event listeners to all links and forms.
 * This method is combined with the cleanup and 
 * basically refreshes the navigation listeners.
 */

Stay.prototype.updateListeners = function()
{
 var self = this, i, l,
  links = document.getElementsByTagName("a"),
  forms = document.getElementsByTagName("form");

 for(i = 0, l = this.navigationListeners.length; i < l; ++i)
 {
  this.navigationListeners[i][0].removeEventListener(this.navigationListeners[i][1], self.switchPage);
 }

 for(i = 0, l = links.length; i < l; ++i)
 {
  links[i].addEventListener("click", self.switchPage);
  this.navigationListeners.push([links[i], "click"]);
 }

 for(i = 0, l = forms.length; i < l; ++i)
 {
  forms[i].addEventListener("submit", self.switchPage);
  this.navigationListeners.push([forms[i], "submit"]);
 }
};

/**
 * Updates the view, the navigation listeners and the history state.
 * Also emits an event to signilize that the page has been loaded.
 *
 * @param {object} response - The response to display.
 */

Stay.prototype.update = function(response)
{
 this.updateView(response);
 this.updateListeners();

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

 this.dispatchEvent(this.eventLoad);
 this.locked = false;
};

/**
 * This function acts when a requested page has completely been received.
 * The response will be a json object or an error page. Anything else will 
 * be treated as a json parse exception.
 *
 * @param {XMLHttpRequest} xhr - The xhr object that fired the event.
 * @param {Event} event - The event of the xhr.
 */

Stay.prototype.handleResponse = function(xhr)
{
 var response = {};

 if(this.responseFields.length === 0)
 {
  response.title = "Setup Error";
  response[this.responseFields[0]] = Stay.Error.NO_RESPONSE_FIELDS;
 }
 else if(xhr.readyState === 4)
 {
  if(xhr.status === 404)
  {
   response.title = "Error " + xhr.status;
   response[this.responseFields[0]] = Stay.Error.NOT_FOUND;
  }
  else if(xhr.status === 0)
  {
   response.title = "Error";
   response[this.responseFields[0]] = Stay.Error.REFUSED;
  }
  else if(xhr.status !== 200)
  {
   response.title = "Error " + xhr.status;
   response[this.responseFields[0]] = Stay.Error.FAILED;
  }
  else
  {
   try
   {
    // It will be assumed that the responseText contains the fields specified in responseFields.
    response = JSON.parse(xhr.responseText);
   }
   catch(e)
   {
    response.title = "Parse Error";
    response[this.responseFields[0]] = Stay.Error.UNPARSABLE;
    console.log(e);
   }
  }

  response.url = xhr.responseURL;
  this.update(response);
 }
};

/**
 * Enumeration of Error Messages.
 */

Stay.Error = Object.freeze({
 NOT_FOUND: "<h1>Error 404</h1><p>Not found.</p>",
 REFUSED: "<h1>Error</h1><p>The server doesn't respond.</p>",
 TIMEOUT: "<h1>Error</h1><p>The server didn't respond in time. Please try again later!</p>",
 FAILED: "<h1>Error</h1><p>The request failed.</p>",
 UNPARSABLE: "<h1>Parse Error</h1><p>The received content could not be parsed.</p>",
 NO_RESPONSE_FIELDS: "<h1>Internal Setup Error</h1><p>No response fields have been specified.</p>"
});

// Reveal public members.
module.exports = Stay;

},{"./eventdispatcher":1}]},{},[2])(2)
});