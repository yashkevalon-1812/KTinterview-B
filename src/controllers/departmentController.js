import DepartmentModel from '../models/Department.js';

// Get all master departments and their domains dynamically from MongoDB
export async function getDepartments(req, res) {
  try {
    const departments = await DepartmentModel.find().sort({ name: 1 });
    res.json({
      success: true,
      count: departments.length,
      departments: departments.map(d => ({
        id: d._id,
        name: d.name || d.department,
        department: d.name || d.department,
        domains: d.domains || []
      }))
    });
  } catch (error) {
    console.error('getDepartments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Add or update a master department in MongoDB
export async function createOrUpdateDepartment(req, res) {
  try {
    const { name, department, domains } = req.body;
    const deptName = (name || department || '').trim();

    if (!deptName || !domains || !Array.isArray(domains)) {
      return res.status(400).json({ success: false, message: 'Valid department name and domains array are required' });
    }

    const doc = await DepartmentModel.findOneAndUpdate(
      { $or: [{ name: deptName }, { department: deptName }] },
      { name: deptName, department: deptName, domains: domains.map(d => d.trim()).filter(Boolean) },
      { upsert: true, new: true }
    );

    res.json({ success: true, department: doc, message: 'Department updated in database successfully' });
  } catch (error) {
    console.error('createOrUpdateDepartment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
