import express from 'express';
import { getCandidates, updateCandidate, submitFeedback } from '../controllers/candidateController.js';

const router = express.Router();

router.get('/', getCandidates);
router.patch('/:id', updateCandidate);
router.post('/:id/feedback', submitFeedback);

export default router;
