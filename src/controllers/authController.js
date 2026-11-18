import UserModel from '../models/User.js';
import CandidateModel from '../models/Candidate.js';

// Determine role dynamically based on request body or email domain
export function determineRole(email = '', requestedRole = '') {
  if (requestedRole && ['admin', 'interviewer', 'candidate'].includes(requestedRole)) {
    return requestedRole;
  }
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail.includes('admin')) {
    return 'admin';
  }
  if (cleanEmail.includes('.kevalon') || cleanEmail.includes('interviewer')) {
    return 'interviewer';
  }
  return 'candidate';
}

// Unified Registration Controller
export async function register(req, res) {
  try {
    const { 
      fullName, 
      email, 
      password, 
      phone, 
      role: explicitRole, 
      appliedRole, 
      experience, 
      currentCtc, 
      expectedCtc, 
      noticePeriod, 
      skills, 
      resumeLink, 
      portfolio 
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists in MongoDB
    const existing = await UserModel.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this email address is already registered. Please sign in instead.' 
      });
    }

    const role = determineRole(cleanEmail, explicitRole);
    let token = '';
    let savedCandidate = null;

    // If candidate, generate dynamic sequential walk-in token and create candidate record in MongoDB
    if (role === 'candidate') {
      const count = await CandidateModel.countDocuments();
      token = `KT-${101 + count}`;

      const candData = {
        tokenNumber: token,
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: (phone || '').trim(),
        appliedRole: appliedRole || 'Walk-in Candidate',
        experience: experience || 'Fresher',
        currentCtc: currentCtc || 'N/A',
        expectedCtc: expectedCtc || 'N/A',
        noticePeriod: noticePeriod || 'Immediate',
        skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
        resumeLink: resumeLink || '',
        portfolio: portfolio || '',
        status: 'Waiting',
        assignedRounds: ['Theory Round', 'Practical Round', 'HR Round'],
        currentRound: 'Theory Round',
        assignedInterviewer: 'Unassigned',
        room: 'Waiting Lounge',
        feedbacks: []
      };

      savedCandidate = await CandidateModel.create(candData);
    }

    // Create User record in MongoDB
    const userData = {
      name: fullName.trim(),
      email: cleanEmail,
      password: password.trim(),
      phone: (phone || '').trim(),
      role,
      designation: role === 'admin' ? 'Operations & HR Head' : role === 'interviewer' ? 'Technical Interviewer' : 'Candidate',
      room: role === 'admin' ? 'Admin Office' : role === 'interviewer' ? 'Room 1 - Tech Round' : 'Waiting Lounge',
      tokenNumber: token,
      candidateId: savedCandidate ? savedCandidate._id : null
    };

    const savedUser = await UserModel.create(userData);

    return res.status(201).json({
      success: true,
      role,
      tokenNumber: token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        designation: savedUser.designation,
        room: savedUser.room,
        tokenNumber: savedUser.tokenNumber,
        candidateProfile: savedCandidate
      },
      message: `Registration successful as ${role.toUpperCase()}! You can now log in.`
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Unified Login Controller
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Query user dynamically from MongoDB
    const user = await UserModel.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please register first.'
      });
    }

    // Verify password
    if (user.password !== password.trim()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please check and try again.'
      });
    }

    // If candidate, dynamically fetch their latest profile from MongoDB
    let candidateProfile = null;
    if (user.role === 'candidate') {
      candidateProfile = await CandidateModel.findOne({
        $or: [{ email: cleanEmail }, { tokenNumber: user.tokenNumber }]
      });
    }

    res.json({
      success: true,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        designation: user.designation,
        room: user.room,
        tokenNumber: user.tokenNumber || (candidateProfile ? candidateProfile.tokenNumber : ''),
        candidateProfile
      },
      message: `Login successful. Welcome, ${user.name}!`
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
