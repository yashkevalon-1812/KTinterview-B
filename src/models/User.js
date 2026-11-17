import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { 
    type: String, 
    enum: ['admin', 'interviewer', 'candidate'], 
    default: 'candidate' 
  },
  designation: { type: String, default: 'Candidate' },
  room: { type: String, default: 'Waiting Lounge' },
  tokenNumber: { type: String, default: '' },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', default: null }
}, { timestamps: true });

export const UserModel = mongoose.model('User', userSchema);
export default UserModel;
