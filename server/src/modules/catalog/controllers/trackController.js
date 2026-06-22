import logger from '../../../core/logger.js';
import { Event } from '../models/event.js';
import { Track } from '../models/track.js';

/**
 * @desc    Create a track for a specific event
 * @route   POST /api/catalog/events/:eventId/tracks
 * @access  Private (Organizer/Admin only)
 */
export const createTrack = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description } = req.body;

    // Verify parent event exists and ownership
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to add tracks to this event' });
    }

    const track = await Track.create({
      eventId,
      name,
      description
    });

    logger.info(`Track created: ${track._id} for Event: ${eventId}`);
    res.status(201).json({ success: true, data: track });
  } catch (error) {
    logger.error(`Create Track Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while creating track' });
  }
};

/**
 * @desc    Get all tracks for an event
 * @route   GET /api/catalog/events/:eventId/tracks
 * @access  Public
 */
export const getEventTracks = async (req, res) => {
  try {
    const { eventId } = req.params;
    const tracks = await Track.find({ eventId }).lean();

    res.status(200).json({ success: true, count: tracks.length, data: tracks });
  } catch (error) {
    logger.error(`Get Tracks Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while fetching tracks' });
  }
};