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

 if(options !== undefined)
 {
  this.contents = (options.contents !== undefined) ? options.contents : null;
  this.navigation = (options.navigation !== undefined) ? options.navigation : null;
  this.infix = (options.infix !== undefined) ? options.infix : "/json";
  this.timeoutPost = (options.timeoutPost !== undefined) ? options.timeoutPost : 60000;
  this.timeoutGet = (options.timeoutGet !== undefined) ? options.timeoutGet : 5000;
  this.responseFields = (options.responseFields !== undefined) ? options.responseFields : ["contents", "navigation"];
 }

 this.locked = false;
 this.absolutePath = null;
 this.containers = [];
 this.intermediateContainer = null;
 this.navigationListeners = [];
 this.eventNavigate = {type: "navigate"};
 this.eventLoad = {type: "load"};

 if(XMLHttpRequest !== undefined)
 {
  this.xhr = new XMLHttpRequest();
  this.xhr.addEventListener("readystatechange", function(event) { self.handleResponse(this, event); });
  this.xhr.addEventListener("timeout", function(event) { self.handleTimeout(event); });
 }
 else
 {
  throw new Error("XHR not supported.");
 }

 window.addEventListener("popstate", function() { self.handleBackForward(); });
 this.clickhandler = function(event) { self.switchPage(this, event); };
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
 * This function is bound to all links and forms
 * and executes the desired page navigation on left clicks.
 *
 * @param {HTMLElement} element - The element that dispatched the event.
 * @param {Event} event - The event.
 */

Stay.prototype.switchPage = function(element, event)
{
 var isRightClick = false;

 if(event.which)
 {
  isRightClick = (event.which === 3);
 }
 else if(event.button)
 {
  isRightClick = (event.button === 2);
 }

 if(!isRightClick)
 {
  event.preventDefault();

  if(!this.locked)
  {
   this.navigate(element);
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
 var self = this,
  links = document.getElementsByTagName("a"),
  forms = document.getElementsByTagName("form"),
  i, l;

 for(i = 0, l = this.navigationListeners.length; i < l; ++i)
 {
  this.navigationListeners[i][0].removeEventListener(this.navigationListeners[i][1], self.clickHandler);
 }

 for(i = 0, l = links.length; i < l; ++i)
 {
  links[i].addEventListener("click", self.clickHandler);
  this.navigationListeners.push([links[i], "click"]);
 }

 for(i = 0, l = forms.length; i < l; ++i)
 {
  forms[i].addEventListener("submit", self.clickHandler);
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
 if(response.url) { this.absolutePath = response.url.replace(this.infix, ""); }
 if(History) { History.pushState(null, response.title, this.absolutePath); }
 this.dispatchEvent(this.loadEvent);
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
 * Support browser functionality "back" and "forward".
 * Depends on the boolean variable "locked" in order to
 * determine whether this navigation should be executed.
 *
 * @param {Event} event - The event, dispatched by window.
 */

Stay.prototype.handleBackForward = function()
{
 if(History && !this.locked) { this.navigate({href: History.getState().url}); }
};

/**
 * Acts when an xhr timeout occurs.
 */

Stay.prototype.handleTimeout = function()
{
 var response = {
  title: "Timeout Error",
  contents: Stay.Error.TIMEOUT
 };

 this.locked = true;
 this.update(response);
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
