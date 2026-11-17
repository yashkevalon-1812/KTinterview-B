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
    const { status, role, search } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (role && role !== 'All') {
      filter.appliedRole = role;
    }
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { tokenNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const candidates = await CandidateModel.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: candidates.length, candidates });
  } catch (error) {
    console.error('getCandidates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Update candidate details, status, or upload CV
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
      currentRound, 
      assignedInterviewer, 
      room 
    } = req.body;

    const update = {};
    if (fullName) update.fullName = fullName.trim();
    if (phone) update.phone = phone.trim();
    if (email) update.email = email.toLowerCase().trim();
    if (currentAddress !== undefined) update.currentAddress = currentAddress;
    if (department !== undefined) update.department = department;
    if (domain !== undefined) update.domain = domain;
    if (appliedRole !== undefined) update.appliedRole = appliedRole;
    if (status) update.status = status;
    if (currentRound) update.currentRound = currentRound;
    if (assignedInterviewer !== undefined) update.assignedInterviewer = assignedInterviewer;
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

    // Find candidate by _id, tokenNumber, or email
    const filter = mongoose.Types.ObjectId.isValid(req.params.id) 
      ? { _id: req.params.id }
      : { $or: [{ tokenNumber: req.params.id }, { email: req.params.id.toLowerCase().trim() }] };

    const updated = await CandidateModel.findOneAndUpdate(filter, update, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Candidate not found in MongoDB' });
    }

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
      notes
    } = req.body;

    const feedbackEntry = {
      interviewerName: interviewerName || 'Interviewer',
      round: round || 'Round 1: Technical',
      technicalRating: Number(technicalRating) || 0,
      communicationRating: Number(communicationRating) || 0,
      problemSolvingRating: Number(problemSolvingRating) || 0,
      experienceMatchRating: Number(experienceMatchRating) || 0,
      decision: decision || 'Hold',
      notes: notes || '',
      date: new Date()
    };

    let newStatus = 'In-Interview';
    let nextRound = round;

    if (decision === 'Select') {
      newStatus = 'Selected';
      nextRound = 'Completed';
    } else if (decision === 'Reject') {
      newStatus = 'Rejected';
      nextRound = 'Completed';
    } else if (decision === 'Advance') {
      if (round.includes('Round 1')) {
        newStatus = 'Round 1 Passed';
        nextRound = 'Round 2: Practical';
      } else if (round.includes('Round 2')) {
        newStatus = 'Round 2 Passed';
        nextRound = 'Round 3: HR';
      } else {
        newStatus = 'Selected';
        nextRound = 'Completed';
      }
    } else if (decision === 'Hold') {
      newStatus = 'On-Hold';
    }

    const filter = mongoose.Types.ObjectId.isValid(req.params.id) 
      ? { _id: req.params.id }
      : { $or: [{ tokenNumber: req.params.id }, { email: req.params.id.toLowerCase().trim() }] };

    const updated = await CandidateModel.findOneAndUpdate(
      filter,
      {
        $push: { feedbacks: feedbackEntry },
        $set: { status: newStatus, currentRound: nextRound }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Candidate not found in MongoDB' });
    }

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
