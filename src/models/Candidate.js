import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  tokenNumber: { type: String, required: true, unique: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  appliedRole: { type: String, default: 'Walk-in Candidate' },
  department: { type: String, default: '' },
  domain: { type: String, default: '' },
  currentAddress: { type: String, default: '' },
  experience: { type: String, default: 'Fresher' },
  currentCtc: { type: String, default: 'N/A' },
  expectedCtc: { type: String, default: 'N/A' },
  noticePeriod: { type: String, default: 'Immediate' },
  skills: [{ type: String }],
  resumeLink: { type: String, default: '' },
  resumeFileName: { type: String, default: '' },
  resumeFileType: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Waiting', 'In-Interview', 'Round 1 Passed', 'Round 2 Passed', 'Selected', 'Rejected', 'On-Hold'],
    default: 'Waiting'
  },
  currentRound: {
    type: String,
    enum: ['Round 1: Technical', 'Round 2: Practical', 'Round 3: HR', 'Completed'],
    default: 'Round 1: Technical'
  },
  assignedInterviewer: { type: String, default: 'Unassigned' },
  room: { type: String, default: 'Waiting Lounge' },
  feedbacks: [
    {
      interviewerName: String,
      round: String,
      technicalRating: Number,
      communicationRating: Number,
      problemSolvingRating: Number,
      experienceMatchRating: Number,
      decision: String,
      notes: String,
      date: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

export const CandidateModel = mongoose.model('Candidate', candidateSchema);
export default CandidateModel;
