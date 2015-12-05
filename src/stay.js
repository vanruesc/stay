import EventDispatcher from "@vanruesc/eventdispatcher";

/**
 * Uses the native browser parsing mechanism
 * to retrieve the pathname of a url.
 *
 * @method getPathname
 * @private
 * @static
 * @param {String} url - The URL to parse.
 * @return {String} The pathname.
 */

function getPathname(url) {

	var a = document.createElement("a");
	a.href = url;

	return a.pathname;

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
 * @param {Array} [options.stderr=console] - The standard output for error messages.
 * @param {String} [options.infix="/json"] - The special url pattern infix for the asynchronous content requests.
 * @param {Number} [options.timeoutPost=60000] - Hard timeout for POST. 0 means no timeout.
 * @param {Number} [options.timeoutGet=5000] - Hard timeout for GET. 0 means no timeout.
 * @param {Boolean} [options.autoUpdate=true] - Whether Stay should automatically update the page content.
 */

export default function Stay(options) {

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
	 * Regular expressions for excluded URIs.
	 *
	 * @property exclusions
	 * @type Array
	 */

	this.exclusions = [];

	/**
	 * The standard error output.
	 * This string represents the ID of the target 
	 * DOM container which should hold any error
	 * messages. If none is specified, errors will 
	 * be logged to the console. A request timeout
	 * is considered an error, for example.
	 *
	 * @property stderr
	 * @type String
	 */

	this.stderr = null;

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
	if(options !== undefined) {

		if(options.stderr !== undefined) { this.stderr = options.stderr; }
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
	 * The current history state.
	 * Can't rely on history.state right now.
	 *
	 * @property historyState
	 * @type Object
	 * @private
	 */

	this.historyState = null;

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

	if(XMLHttpRequest !== undefined) {

		this.xhr = new XMLHttpRequest();

	} else {

		throw new Error("XMLHttpRequest is not supported.");

	}

	/**
	 * Returns XmlHttpRequest errors.
	 *
	 * @event error
	 */

	this.xhr.addEventListener("error", function handleError(e) { self.dispatchEvent(e); });

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

	this.xhr.addEventListener("timeout", function handleTimeout() {

		var response = {meta: {}};

		response.meta.title = "Timeout Error";

		if(self.stderr !== null) {

			response[self.stderr] = "<p>" + Stay.Error.TIMEOUT + "</p>";

		} else {

			console.error(Stay.Error.TIMEOUT);

		}

		self.locked = true;
		self.update(response);

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

	window.addEventListener("popstate", function handleBackForward(event) {

		if(!self.locked && event.state !== null) {

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

	this._switchPage = function(event) {

		var preventable = (event.preventDefault !== undefined);
		var proceed = false;

		if(event.type === "submit") {

			proceed = true;

		} else if(!event.metaKey && !event.shiftKey && !event.altKey && !event.ctrlKey) {

			if(event.which !== undefined) {

				proceed = event.which === 1;

			} else if(event.button !== undefined) {

				proceed = event.button === 0;

			}

		}

		if(proceed) {

			if(preventable) { event.preventDefault(); }
			if(!self.locked) { self._navigate(event.target); }

		}

		// Only return false if it was a left click and the default behaviour couldn't be prevented.
		return !(proceed && !preventable);

	};

	// Indirectly push the initial state.
	this.update({
		meta: {
			title: document.title,
			url: location.href
		}
	});

	// Start the system by binding all event handlers.
	switch(document.readyState) {

		case "loading":
			document.addEventListener("DOMContentLoaded", function init() {

				document.removeEventListener("DOMContentLoaded", init);
				self._updateListeners();

			});
			break;
	
		default:
			this._updateListeners();
			break;

	}

}

Stay.prototype = Object.create(EventDispatcher.prototype);
Stay.prototype.constructor = Stay;

/**
 * Navigates to the next target uri.
 *
 * @method _navigate
 * @private
 * @param {HTMLElement} firingElement - The element on which the click event occured.
 */

Stay.prototype._navigate = function(firingElement) {

	var formData, pathname, url, post = false;

	this.locked = true;

	if(firingElement.action) {

		// Collect form data if the firing element is a form.
		this.absolutePath = firingElement.action;
		formData = new FormData(firingElement);
		post = true;

	} else {

		this.absolutePath = firingElement.href;

	}

	pathname = getPathname(this.absolutePath);
	if(pathname.charAt(0) !== "/") { pathname = "/" + pathname; }

	// Special treatment for the index page.
	url = (pathname === "/") ?
		this.absolutePath.slice(0, this.absolutePath.length - 1) + this.infix + pathname :
		this.absolutePath.replace(new RegExp(pathname), this.infix + pathname);

	this.eventNavigate.method = post ? "POST" : "GET";
	this.dispatchEvent(this.eventNavigate);

	try {

		this.xhr.open(this.eventNavigate.method, url, true);

		if(post) {

			this.xhr.timeout = this.timeoutPost;
			this.xhr.send(formData);

		} else {

			this.xhr.timeout = this.timeoutGet;
			this.xhr.send();

		}

	} catch(error) {

		this.dispatchEvent(error);

	}

};

/**
 * Updates the containers with the new data.
 *
 * @method _updateView
 * @private
 * @param {object} response - The properties of the response object correspond with the target DOM containers.
 */

Stay.prototype._updateView = function(response) {

	var responseField, c, r;
	var contentChanged = false;

	if(this.intermediateContainer === null) {

		this.intermediateContainer = document.createElement("div");

	} else {

		// Clear the intermediate container.
		while(this.intermediateContainer.children.length > 0) {

			this.intermediateContainer.removeChild(this.intermediateContainer.children[0]);

		}

	}

	for(responseField in response) {

		r = response[responseField];

		// Ignore deep structures.
		if(typeof r !== "object") {

			c = this.containers[responseField];

			if(c === undefined) {

				// No reference exists yet. Find the DOM element and remember it.
				c = this.containers[responseField] = document.getElementById(responseField);

			}

			if(c !== null) {

				while(c.children.length > 0) {

					c.removeChild(c.children[0]);

				}

				// Let the browser create the DOM elements from the html string.
				this.intermediateContainer.innerHTML = r;

				// Cut & paste them one after another.
				while(this.intermediateContainer.children.length > 0) {

					c.appendChild(this.intermediateContainer.children[0]);

				}

				contentChanged = true;

			} else {

				console.warn(Stay.Error.NO_CONTAINER, responseField);

			}

		}

	}

	if(contentChanged) {

		this._updateListeners();

	}

};

/**
 * If you want to destroy Stay, you should call this method
 * before you drop your reference to the Stay instance.
 *
 * @method unbindListeners
 */

Stay.prototype.unbindListeners = function() {

	var self = this;
	var signature;

	while(this.navigationListeners.length > 0) {

		signature = this.navigationListeners.pop();
		signature[0].removeEventListener(signature[1], self._switchPage);

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

Stay.prototype._updateListeners = function() {

	var self = this;
	var links = document.getElementsByTagName("a");
	var forms = document.getElementsByTagName("form");
	var i, j, li, lj;
	var exclude;

	this.unbindListeners();

	for(i = 0, li = links.length; i < li; ++i) {

		if(this.local.test(links[i].href)) {

			for(j = 0, lj = this.exclusions.length, exclude = false; !exclude && j < lj; ++j) {

				if(this.exclusions[j].test(links[i].href)) { exclude = true; }

			}

			if(!exclude) {

				links[i].addEventListener("click", self._switchPage);
				this.navigationListeners.push([links[i], "click"]);

			}

		}

	}

	for(i = 0, li = forms.length; i < li; ++i) {

		if(this.local.test(forms[i].action)) {

			for(j = 0, lj = this.exclusions.length, exclude = false; !exclude && j < lj; ++j) {

				if(this.exclusions[j].test(forms[i].action)) { exclude = true; }

			}

			if(!exclude) {

				forms[i].addEventListener("submit", self._switchPage);
				this.navigationListeners.push([forms[i], "submit"]);

			}

		}

	}

};

/**
 * Updates the view, the navigation listeners and the history state.
 * Also emits an event to signilise that the page has been loaded.
 *
 * The update function needs to be called after each navigation in 
 * order to unlock the system! This happens by default, but that
 * behaviour can be disabled. It is then the responsibility of the
 * programmer to call stay.update(response) with the response data
 * provided by the "receive" event.
 *
 * @method update
 * @param {object} response - The response to display.
 */

Stay.prototype.update = function(response) {

	var origin;

	this._updateView(response);
	document.title = response.meta.title;

	if(response.meta.url) {

		this.absolutePath = response.meta.url.replace(this.infix, "");

	}

	if(!this.backForward) {

		if(this.historyState === null || this.absolutePath !== this.historyState.url) {

			this.historyState = {
				url: this.absolutePath,
				time: Date.now(),
				changed: true
			};

		} else {

			this.historyState.changed = false;

		}

		origin = document.origin ? document.origin : document.defaultView.location.origin ? document.defaultView.location.origin : "null";

		// Cannot modify history if no document origin exists.
		if(origin !== "null") {

			try {

				if(this.historyState.changed) {

					history.pushState(this.historyState, response.meta.title, this.absolutePath);

				} else {

					history.replaceState(this.historyState, response.meta.title, this.absolutePath);

				}

			} catch(error) {

				// Browser-specific history error.
				console.warn(error);

			}

		}

	} else {

		this.backForward = false;

	}

	this.eventReceive.response = null;
	this.dispatchEvent(this.eventLoad);
	this.locked = false;

};

/**
 * This function acts when the xhr object changes its readyState.
 * The response will be a JSON object or an error page. Anything else will 
 * be caught as a JSON parse exception and announced in stderr.
 *
 * @method _handleResponse
 * @private
 * @param {XMLHttpRequest} xhr - The xhr object that fired the event.
 */

Stay.prototype._handleResponse = function(xhr) {

	var response = {meta: {}};

	if(xhr.readyState === 4) {

		try {

			response = JSON.parse(xhr.responseText);

		} catch(e) {

			response.meta.title = "Parse Error";

			if(this.stderr !== null) {

				response[this.stderr] = "<p>" + Stay.Error.UNPARSABLE + "</p>";

			}

			console.error(Stay.Error.UNPARSABLE);

		}

		response.meta.url = xhr.responseURL;
		this.eventReceive.status = xhr.status;
		this.eventReceive.response = response;
		this.dispatchEvent(this.eventReceive);

		if(this.autoUpdate) {

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
	TIMEOUT: "The server didn't respond in time. Please try again later!",
	UNPARSABLE: "The received content could not be parsed.",
	NO_CONTAINER: "Couldn't find a container for:"
});
