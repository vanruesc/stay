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
