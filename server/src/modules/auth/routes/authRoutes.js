import express from 'express';
import { googleLogin, logout, refreshToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/google', googleLogin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;