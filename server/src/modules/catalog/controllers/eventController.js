import * as authModule from '../../auth/index.js';
import logger from '../../../core/logger.js';
import { Event } from '../models/event.js';

/**
 * @desc    Create a new event
 * @route   POST /api/catalog/events
 * @access  Private (Organizer/Admin only)
 */
export const createEvent = async (req, res) => {
  try {
    const { title, description, bannerUrl, startsAt, endsAt, timezone, visibility, features, capacity } = req.body;

    // Basic date validation
    if (new Date(startsAt) >= new Date(endsAt)) {
      return res.status(400).json({ success: false, message: 'Event end time must be after start time' });
    }

    const event = await Event.create({
      title,
      description,
      bannerUrl,
      startsAt,
      endsAt,
      timezone,
      visibility,
      features,
      capacity,
      createdBy: req.user.id // Pulled securely from our requireAuth middleware
    });

    logger.info(`New event created: ${event._id} by User: ${req.user.id}`);
    
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    logger.error(`Create Event Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while creating event' });
  }
};

/**
 * @desc    Get event by ID (Public view)
 * @route   GET /api/catalog/events/:id
 * @access  Public
 */
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // ==========================================
    // API COMPOSITION: Fetching across modules
    // ==========================================
    // We ask the Auth module for the creator's details instead of using .populate()
    let organizerDetails = null;
    try {
      organizerDetails = await authModule.getUserById(event.createdBy);
    } catch (err) {
      logger.warn(`Could not fetch organizer details for event ${event._id}`);
    }

    // Stitch the response together for the frontend
    const responseData = {
      ...event,
      organizer: organizerDetails ? {
        name: organizerDetails.name,
        avatarUrl: organizerDetails.avatarUrl
      } : { name: 'Unknown Organizer' }
    };

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    logger.error(`Get Event Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while fetching event' });
  }
};

/**
 * @desc    Get all published events
 * @route   GET /api/catalog/events
 * @access  Public
 */
export const getPublishedEvents = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;


    // Optional Search Filter by Event Title
    const keyword = req.query.keyword
      ? { title: { $regex: req.query.keyword, $options: 'i' } }
      : {};

    // Combine filters
    const query = { status: 'published', visibility: 'public', ...keyword };

    // Fetch total count for frontend pagination UI
    const total = await Event.countDocuments(query);

    // Fetch the specific page of active, published events
    const events = await Event.find(query)
      .sort({ startsAt: 1 }) // Sort by upcoming
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({ 
      success: true, 
      count: events.length, 
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: events 
    });
  } catch (error) {
    logger.error(`Get Published Events Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while fetching events' });
  }
};