import express from 'express';
import { createEvent, getEventById, getPublishedEvents } from './controllers/eventController.js';
import { createSession, getEventSessions } from './controllers/sessionController.js';
import { createTrack, getEventTracks } from './controllers/trackController.js';
import { createSpeaker, assignSpeakerToSession, getSessionSpeakers } from './controllers/speakerController.js';
import { requireAuth, requireRole } from '../auth/index.js'; // Importing from Auth module's public interface

const router = express.Router();

// --- EVENT ROUTES ---
router.get('/events', getPublishedEvents); // Public directory
router.get('/events/:id', getEventById); // Public details

// Protected Organizer Routes
router.post('/events', requireAuth, requireRole(['organizer', 'admin']), createEvent);

// --- TRACK ROUTES ---
router.get('/events/:eventId/tracks', getEventTracks); // Public track list

// Protected Organizer Routes
router.post('/events/:eventId/tracks', requireAuth, requireRole(['organizer', 'admin']), createTrack);

// --- SESSION ROUTES ---
router.get('/events/:eventId/sessions', getEventSessions); // Public schedule

// Protected Organizer Routes
router.post('/events/:eventId/sessions', requireAuth, requireRole(['organizer', 'admin']), createSession);

// --- SPEAKER ROUTES ---
// Protected Organizer Routes (Creating global profiles and assigning them)
router.post('/speakers', requireAuth, requireRole(['organizer', 'admin']), createSpeaker);
router.post('/sessions/:sessionId/speakers', requireAuth, requireRole(['organizer', 'admin']), assignSpeakerToSession);

// Public speaker lists for a session
router.get('/sessions/:sessionId/speakers', getSessionSpeakers);

export default router;