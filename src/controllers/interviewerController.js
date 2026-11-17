import UserModel from '../models/User.js';

// Get all interviewers dynamically from MongoDB
export async function getInterviewers(req, res) {
  try {
    const interviewers = await UserModel.find({ role: 'interviewer' }).select('-password').sort({ name: 1 });
    res.json({
      success: true,
      count: interviewers.length,
      interviewers: interviewers.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        designation: u.designation,
        room: u.room
      }))
    });
  } catch (error) {
    console.error('getInterviewers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
