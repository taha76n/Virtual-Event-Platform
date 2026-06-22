import logger from '../../../core/logger.js';
import { Event } from '../models/event.js';
import { Session } from '../models/session.js';

/**
 * @desc    Create a session for an event
 * @route   POST /api/catalog/events/:eventId/sessions
 * @access  Private (Organizer only)
 */
export const createSession = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, abstract, trackId, startsAt, endsAt, capacity, streamProvider } = req.body;

    // 1. Fetch parent Event to verify ownership and dates
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Parent event not found' });
    }

    // Verify the user creating the session is the actual organizer of the event
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to add sessions to this event' });
    }

    // ==========================================
    // OPTION B: Controller-Level Data Validation
    // ==========================================
    const sessionStart = new Date(startsAt);
    const sessionEnd = new Date(endsAt);
    const eventStart = new Date(event.startsAt);
    const eventEnd = new Date(event.endsAt);

    if (sessionStart >= sessionEnd) {
      return res.status(400).json({ success: false, message: 'Session end time must be after start time' });
    }

    if (sessionStart < eventStart || sessionEnd > eventEnd) {
      return res.status(400).json({ 
        success: false, 
        message: `Session times must fall within the event schedule (${eventStart.toISOString()} to ${eventEnd.toISOString()})` 
      });
    }

    // 2. Create the Session
    const session = await Session.create({
      eventId,
      title,
      abstract,
      trackId,
      startsAt,
      endsAt,
      capacity,
      streamProvider
    });

    logger.info(`Session created: ${session._id} for Event: ${eventId}`);
    res.status(201).json({ success: true, data: session });

  } catch (error) {
    logger.error(`Create Session Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while creating session' });
  }
};

/**
 * @desc    Get all sessions for a specific event
 * @route   GET /api/catalog/events/:eventId/sessions
 * @access  Public
 */
export const getEventSessions = async (req, res) => {
  try {
    const { eventId } = req.params;

    const sessions = await Session.find({ eventId })
      .sort({ startsAt: 1 }) // Chronological order for the frontend schedule
      .lean();

    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    logger.error(`Get Sessions Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while fetching sessions' });
  }
};