import logger from '../../../core/logger.js';
import { Session } from '../models/session.js';
import { SessionSpeaker } from '../models/sessionSpeaker.js';
import { Speaker } from '../models/speaker.js';

/**
 * @desc    Create a new speaker profile (Global directory)
 * @route   POST /api/catalog/speakers
 * @access  Private (Organizer/Admin only)
 */
export const createSpeaker = async (req, res) => {
  try {
    const { name, email, bio, avatarUrl, linkedInUrl } = req.body;

    const speaker = await Speaker.create({
      name,
      email,
      bio,
      avatarUrl,
      linkedInUrl
    });

    logger.info(`New speaker profile created: ${speaker._id}`);
    res.status(201).json({ success: true, data: speaker });
  } catch (error) {
    logger.error(`Create Speaker Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while creating speaker' });
  }
};

/**
 * @desc    Assign a speaker to a session
 * @route   POST /api/catalog/sessions/:sessionId/speakers
 * @access  Private (Organizer/Admin only)
 */
export const assignSpeakerToSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { speakerId, role } = req.body;

    // 1. Verify session and event ownership
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const event = await Event.findById(session.eventId);
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this session' });
    }

    // 2. Verify speaker exists
    const speakerExists = await Speaker.exists({ _id: speakerId });
    if (!speakerExists) {
      return res.status(404).json({ success: false, message: 'Speaker not found in directory' });
    }

    // 3. Create the join record
    const assignment = await SessionSpeaker.create({
      sessionId,
      speakerId,
      role
    });

    logger.info(`Speaker ${speakerId} assigned to Session ${sessionId}`);
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    // Handle MongoDB duplicate key error (speaker already in this session)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Speaker is already assigned to this session' });
    }
    logger.error(`Assign Speaker Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while assigning speaker' });
  }
};

/**
 * @desc    Get all speakers for a specific session
 * @route   GET /api/catalog/sessions/:sessionId/speakers
 * @access  Public
 */
export const getSessionSpeakers = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // INTRA-MODULE POPULATE: 
    // This is safe because both schemas live inside the Catalog module.
    const assignments = await SessionSpeaker.find({ sessionId })
      .populate('speakerId', '-email') // Exclude private email from public view
      .lean();

    // Format the response to be clean for the frontend
    const speakers = assignments.map(assignment => ({
      ...assignment.speakerId,
      role: assignment.role // Include their specific role in this session
    }));

    res.status(200).json({ success: true, count: speakers.length, data: speakers });
  } catch (error) {
    logger.error(`Get Session Speakers Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while fetching speakers' });
  }
};