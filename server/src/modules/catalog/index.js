import { Event } from "./models/event.js";
import { Session } from "./models/session.js";

/**
 * PUBLIC INTERFACE FOR THE CATALOG MODULE
 * Other modules (Ticketing, Realtime) must use these methods.
 */


/**
 * Fetches basic event details by ID.
 * @param {String} eventId 
 * @returns {Promise<Object|null>}
 */
export const getEventById = async (eventId) => {
  return await Event.findById(eventId).select('-__v').lean();
};

/**
 * Checks if an event is currently published and active.
 * Highly useful for the Ticketing module before generating an order.
 * @param {String} eventId 
 * @returns {Promise<Boolean>}
 */
export const isEventPublished = async (eventId) => {
  const event = await Event.findById(eventId).select('status').lean();
  return event?.status === 'published';
};

/**
 * Fetches a session to verify its stream provider and times.
 * Useful for the Realtime module before connecting a user to a Socket room.
 * @param {String} sessionId 
 * @returns {Promise<Object|null>}
 */
export const getSessionById = async (sessionId) => {
  return await Session.findById(sessionId).select('-__v').lean();
};

/**
 * Resolves an array of Event IDs into Event objects (API Composition helper)
 * @param {Array<String>} eventIds 
 * @returns {Promise<Array<Object>>}
 */
export const getEventsByIds = async (eventIds) => {
  return await Event.find({ _id: { $in: eventIds } }).select('-__v').lean();
};