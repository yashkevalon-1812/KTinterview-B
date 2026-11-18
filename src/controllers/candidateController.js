import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import CandidateModel from '../models/Candidate.js';
import UserModel from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all candidates dynamically from MongoDB with optional filters
export async function getCandidates(req, res) {
  try {
    const { status, role, search, interviewer, interviewerEmail } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (role && role !== 'All') {
      filter.appliedRole = role;
    }
    if (interviewer || interviewerEmail) {
      const cleanName = (interviewer || '').trim();
      const cleanEmail = (interviewerEmail || '').toLowerCase().trim();
      const orClauses = [];
      if (cleanEmail) {
        orClauses.push({ assignedInterviewerEmail: cleanEmail });
      }
      if (cleanName) {
        const escaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        orClauses.push({
          $and: [
            { $or: [{ assignedInterviewerEmail: '' }, { assignedInterviewerEmail: { $exists: false } }] },
            { assignedInterviewer: { $regex: `^${escaped}$`, $options: 'i' } }
          ]
        });
      }
      if (orClauses.length > 0) {
        filter.$and = [...(filter.$and || []), { $or: orClauses }];
      }
    }
    if (search) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { fullName: { $regex: search, $options: 'i' } },
            { tokenNumber: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    const candidates = await CandidateModel.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: candidates.length, candidates });
  } catch (error) {
    console.error('getCandidates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

const ALL_ROUNDS = ['Theory Round', 'Practical Round', 'HR Round'];

function normalizeAssignedRounds(rounds) {
  if (!Array.isArray(rounds)) return null;
  const ordered = ALL_ROUNDS.filter(r => rounds.includes(r));
  return ordered.length > 0 ? ordered : null;
}

function canonicalRoundName(roundStr = '') {
  const r = String(roundStr).toLowerCase();
  if (r.includes('theory') || r.includes('technical') || r.includes('round 1')) return 'Theory Round';
  if (r.includes('practical') || r.includes('round 2')) return 'Practical Round';
  if (r.includes('hr') || r.includes('round 3')) return 'HR Round';
  return roundStr || 'Theory Round';
}

// Update candidate details, status, person-wise rounds, or upload CV
export async function updateCandidate(req, res) {
  try {
    const {
      fullName,
      phone,
      email,
      currentAddress,
      department,
      domain,
      appliedRole,
      resumeLink,
      resumeBase64,
      resumeFileName,
      resumeFileType,
      status, 
      assignedRounds,
      currentRound, 
      assignedInterviewer, 
      assignedInterviewerEmail,
      room 
    } = req.body;

    // Find candidate by _id, tokenNumber, or email
    const filter = mongoose.Types.ObjectId.isValid(req.params.id) 
      ? { _id: req.params.id }
      : { $or: [{ tokenNumber: req.params.id }, { email: req.params.id.toLowerCase().trim() }] };

    const existingCandidate = await CandidateModel.findOne(filter);
    if (!existingCandidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found in MongoDB' });
    }

    const update = {};
    if (fullName) update.fullName = fullName.trim();
    if (phone) update.phone = phone.trim();
    if (email) update.email = email.toLowerCase().trim();
    if (currentAddress !== undefined) update.currentAddress = currentAddress;
    if (department !== undefined) update.department = department;
    if (domain !== undefined) update.domain = domain;
    if (appliedRole !== undefined) update.appliedRole = appliedRole;
    if (status) update.status = status;

    if (assignedRounds !== undefined) {
      const normalized = normalizeAssignedRounds(assignedRounds);
      if (!normalized) {
        return res.status(400).json({ success: false, message: 'Please select at least one interview round (Theory, Practical, or HR).' });
      }
      update.assignedRounds = normalized;
      // Keep currentRound aligned with the newly assigned rounds unless explicitly provided or already Completed
      if (!currentRound && existingCandidate.currentRound !== 'Completed' && !normalized.includes(existingCandidate.currentRound)) {
        update.currentRound = normalized[0];
      }
    }

    if (currentRound) update.currentRound = currentRound;
    if (assignedInterviewer !== undefined) update.assignedInterviewer = assignedInterviewer;
    if (assignedInterviewerEmail !== undefined) {
      update.assignedInterviewerEmail = String(assignedInterviewerEmail || '').toLowerCase().trim();
    }
    if (room !== undefined) update.room = room;

    // Handle CV file upload (PDF document or Photo/Image)
    if (resumeBase64) {
      try {
        const matches = resumeBase64.match(/^data:([A-Za-z0-9\-+\/.]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const fileData = matches[2];
          const buffer = Buffer.from(fileData, 'base64');

          let ext = '.pdf';
          if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = '.jpg';
          else if (mimeType.includes('png')) ext = '.png';
          else if (mimeType.includes('webp')) ext = '.webp';
          else if (mimeType.includes('gif')) ext = '.gif';
          else if (mimeType.includes('pdf')) ext = '.pdf';

          const safeId = String(req.params.id || 'candidate').replace(/[^a-zA-Z0-9_-]/g, '');
          const filename = `CV-${safeId}-${Date.now()}${ext}`;
          const savePath = path.join(uploadsDir, filename);

          fs.writeFileSync(savePath, buffer);
          update.resumeLink = `/uploads/${filename}`;
          update.resumeFileName = resumeFileName || filename;
          update.resumeFileType = mimeType;
        }
      } catch (err) {
        console.error('Failed to save CV file:', err);
      }
    } else if (resumeLink !== undefined) {
      update.resumeLink = resumeLink;
    }

    const updated = await CandidateModel.findOneAndUpdate(filter, update, { new: true });

    // Keep UserModel in sync with full name and phone
    if (fullName || phone) {
      await UserModel.findOneAndUpdate(
        { $or: [{ tokenNumber: updated.tokenNumber }, { email: updated.email }] },
        { 
          ...(fullName ? { name: fullName } : {}), 
          ...(phone ? { phone: phone } : {}) 
        }
      );
    }

    res.json({ success: true, candidate: updated, message: 'Candidate details saved successfully to MongoDB' });
  } catch (error) {
    console.error('updateCandidate error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Submit Interview Feedback
export async function submitFeedback(req, res) {
  try {
    const {
      interviewerName,
      round,
      technicalRating,
      communicationRating,
      problemSolvingRating,
      experienceMatchRating,
      decision,
      notes,
      candidateType,
      salaryExpectation,
      internshipType,
      stipendAmount
    } = req.body;

    const filter = mongoose.Types.ObjectId.isValid(req.params.id) 
      ? { _id: req.params.id }
      : { $or: [{ tokenNumber: req.params.id }, { email: req.params.id.toLowerCase().trim() }] };

    const existing = await CandidateModel.findOne(filter);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Candidate not found in MongoDB' });
    }

    const candidateRounds =
      Array.isArray(existing.assignedRounds) && existing.assignedRounds.length > 0
        ? existing.assignedRounds
        : ALL_ROUNDS;

    const activeRound = canonicalRoundName(round || existing.currentRound || candidateRounds[0]);

    const cleanType = ['Employee', 'Intern'].includes(candidateType) ? candidateType : '';
    const cleanSalary = cleanType === 'Employee' ? String(salaryExpectation || '').trim() : '';
    const cleanInternType =
      cleanType === 'Intern' && ['Paid', 'Unpaid'].includes(internshipType) ? internshipType : '';
    const cleanStipend =
      cleanType === 'Intern' && cleanInternType === 'Paid' ? String(stipendAmount || '').trim() : '';

    const feedbackEntry = {
      interviewerName: interviewerName || 'Interviewer',
      round: activeRound,
      technicalRating: Number(technicalRating) || 0,
      communicationRating: Number(communicationRating) || 0,
      problemSolvingRating: Number(problemSolvingRating) || 0,
      experienceMatchRating: Number(experienceMatchRating) || 0,
      decision: decision || 'Hold',
      notes: notes || '',
      candidateType: cleanType,
      salaryExpectation: cleanSalary,
      internshipType: cleanInternType,
      stipendAmount: cleanStipend,
      date: new Date()
    };

    let newStatus = 'In-Interview';
    let nextRound = activeRound;

    if (decision === 'Select') {
      newStatus = 'Selected';
      nextRound = 'Completed';
    } else if (decision === 'Reject') {
      newStatus = 'Rejected';
      nextRound = 'Completed';
    } else if (decision === 'Advance') {
      const currentIndex = candidateRounds.indexOf(activeRound);
      if (currentIndex !== -1 && currentIndex < candidateRounds.length - 1) {
        nextRound = candidateRounds[currentIndex + 1];
        newStatus = currentIndex === 0 ? 'Round 1 Passed' : 'Round 2 Passed';
      } else {
        // Passed the final assigned round for this candidate -> Selected!
        newStatus = 'Selected';
        nextRound = 'Completed';
      }
    } else if (decision === 'Hold') {
      newStatus = 'On-Hold';
    }

    const setFields = {
      status: newStatus,
      currentRound: nextRound
    };

    if (cleanType) {
      setFields.candidateType = cleanType;
      setFields.salaryExpectation = cleanSalary;
      setFields.internshipType = cleanInternType;
      setFields.stipendAmount = cleanStipend;

      if (cleanType === 'Employee' && cleanSalary) {
        setFields.expectedCtc = cleanSalary;
      } else if (cleanType === 'Intern' && cleanInternType) {
        setFields.expectedCtc =
          cleanInternType === 'Paid'
            ? cleanStipend
              ? `Paid Intern (${cleanStipend})`
              : 'Paid Internship'
            : 'Unpaid Internship';
      }
    }

    const updated = await CandidateModel.findOneAndUpdate(
      filter,
      {
        $push: { feedbacks: feedbackEntry },
        $set: setFields
      },
      { new: true }
    );

    res.json({
      success: true,
      candidate: updated,
      message: `Feedback recorded! Candidate status updated to: ${newStatus}`
    });
  } catch (error) {
    console.error('submitFeedback error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
