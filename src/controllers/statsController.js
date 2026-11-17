import CandidateModel from '../models/Candidate.js';

// Dynamically compute interview drive stats from MongoDB
export async function getStats(req, res) {
  try {
    const total = await CandidateModel.countDocuments();
    const waiting = await CandidateModel.countDocuments({ status: 'Waiting' });
    const inInterview = await CandidateModel.countDocuments({ status: { $regex: /interview|in-progress/i } });
    const round1Passed = await CandidateModel.countDocuments({ status: { $regex: /round 1 passed/i } });
    const round2Passed = await CandidateModel.countDocuments({ status: { $regex: /round 2 passed/i } });
    const selected = await CandidateModel.countDocuments({ status: 'Selected' });
    const rejected = await CandidateModel.countDocuments({ status: 'Rejected' });
    const onHold = await CandidateModel.countDocuments({ status: 'On-Hold' });

    res.json({
      success: true,
      stats: {
        total,
        waiting,
        inInterview,
        round1Passed,
        round2Passed,
        selected,
        rejected,
        onHold
      }
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
