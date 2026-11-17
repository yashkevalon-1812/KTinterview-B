import express from 'express';
import { getInterviewers } from '../controllers/interviewerController.js';

const router = express.Router();

router.get('/', getInterviewers);

export default router;
