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
  candidateType: { type: String, enum: ['', 'Employee', 'Intern'], default: '' },
  salaryExpectation: { type: String, default: '' },
  internshipType: { type: String, enum: ['', 'Paid', 'Unpaid'], default: '' },
  stipendAmount: { type: String, default: '' },
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
  assignedRounds: {
    type: [String],
    default: ['Theory Round', 'Practical Round', 'HR Round']
  },
  currentRound: {
    type: String,
    default: 'Theory Round'
  },
  assignedInterviewer: { type: String, default: 'Unassigned' },
  assignedInterviewerEmail: { type: String, default: '', lowercase: true, trim: true },
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
      candidateType: { type: String, default: '' },
      salaryExpectation: { type: String, default: '' },
      internshipType: { type: String, default: '' },
      stipendAmount: { type: String, default: '' },
      date: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

export const CandidateModel = mongoose.model('Candidate', candidateSchema);
export default CandidateModel;
