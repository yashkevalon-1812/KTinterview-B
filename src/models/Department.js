import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  department: { type: String, trim: true },
  domains: [{ type: String, required: true }]
}, { timestamps: true, strict: false });

export const DepartmentModel = mongoose.model('Department', departmentSchema);
export default DepartmentModel;
