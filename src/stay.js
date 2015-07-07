"use strict";

var EventDispatcher = require("@zayesh/eventdispatcher"),
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
 * @constructor
 * @param {Object} options - The options.
 * @param {array} options.responseField - The content container IDs. These have to be the same as the data fields in the server response.
 * @param {string} options.infix - The special url pattern infix for the asynchronous content requests.
 * @param {number} options.timeoutPost - Hard timeout for POST. 0 means no timeout. Default is 60000 (ms).
 * @param {number} options.timeoutGet - Hard timeout for GET. 0 means no timeout. Default is 5000 (ms).
 * @param {boolean} options.autoUpdate - Whether Stay should automatically update the page content. Defaults to true.
 */

function Stay(options)
{
 var self = this;

 EventDispatcher.call(this);

 this.responseFields = ["content", "navigation"];
 this.infix = "/json";
 this.timeoutPost = 60000;
 this.timeoutGet = 5000;
 this.autoUpdate = true;

 if(options !== undefined)
 {
  if(options.responseFields !== undefined) { this.responseFields = options.responseFields; }
  if(options.infix !== undefined) { this.infix = options.infix; }
  if(options.timeoutPost !== undefined) { this.timeoutPost = options.timeoutPost; }
  if(options.timeoutGet !== undefined) { this.timeoutGet = options.timeoutGet; }
  if(options.autoUpdate !== undefined) { this.autoUpdate = options.autoUpdate; }
 }

 this.locked = false;
 this.backForward = false;
 this.absolutePath = null;
 this.containers = [];
 this.intermediateContainer = null;
 this.navigationListeners = [];
 this.eventNavigate = {type: "navigate"};
 this.eventContentReceived = {type: "contentreceived", response: null};
 this.eventLoad = {type: "load"};

 this.xhr = new XMLHttpRequest();
 this.xhr.addEventListener("readystatechange", function(event) { self._handleResponse(this, event); });
 this.xhr.addEventListener("timeout", function()
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
  * @param {Event} event - The event, dispatched by window.
  */

 window.addEventListener("popstate", function(event)
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
  * @param {HTMLElement} element - The element that dispatched the event.
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
   if(!self.locked) { self._navigate(this); }
  }

  // Only return false if it was a left click, but the default behaviour couldn't be prevented.
  return !(proceed && !preventable);
 };

 // Start the system by binding all handlers.
 this._updateListeners();
}

Stay.prototype = Object.create(EventDispatcher.prototype);
Stay.prototype.constructor = Stay;

/**
 * Navigates to the next target uri.
 *
 * @param {HTMLElement} firingElement - The element on which the click event occured.
 */

Stay.prototype._navigate = function(firingElement)
{
 var formData, parts, url, post = false;

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

 parts = getUrlParts(this.absolutePath);
 this.locked = true;

 // Special treatment for the index page.
 url = (parts.pathname === index) ?
  this.absolutePath.slice(0, this.absolutePath.length - 1) + this.infix + parts.pathname :
  this.absolutePath.replace(parts.pathname, this.infix + parts.pathname);

 this.eventNavigate.method = post ? "POST" : "GET";
 this.dispatchEvent(this.eventNavigate);

 if(post)
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
 * This method is combined with the cleanup and 
 * basically refreshes the navigation listeners.
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
  links[i].addEventListener("click", self._switchPage);
  this.navigationListeners.push([links[i], "click"]);
 }

 for(i = 0, l = forms.length; i < l; ++i)
 {
  forms[i].addEventListener("submit", self._switchPage);
  this.navigationListeners.push([forms[i], "submit"]);
 }
};

/**
 * Updates the view, the navigation listeners and the history state.
 * Also emits an event to signilize that the page has been loaded.
 *
 * The update function needs to be called after each navigation in 
 * order to unlock the system. This happens by default, but that
 * behaviour can be disabled. It is then the responsibility of the
 * programmer to call update with the response data provided by the
 * "contentreceived" event.
 *
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

 this.eventContentReceived.response = null;
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
   console.log(e);
  }

  response.url = xhr.responseURL;
  this.eventContentReceived.response = response;
  this.dispatchEvent(this.eventContentReceived);

  if(this.autoUpdate)
  {
   this.update(response);
  }
 }
};

/**
 * Enumeration of Error Messages.
 */

Stay.Error = Object.freeze({
 TIMEOUT: "<p>The server didn't respond in time. Please try again later!</p>",
 UNPARSABLE: "<p>The received content could not be parsed.</p>",
 NO_RESPONSE_FIELDS: "<p>No response fields have been specified.</p>"
});

// Reveal public members.
module.exports = Stay;
