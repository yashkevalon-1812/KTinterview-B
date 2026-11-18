import mongoose from 'mongoose';
import UserModel from '../models/User.js';
import DepartmentModel from '../models/Department.js';

const initialDepartments = [
  {
    name: 'Information Technology (IT / Software)',
    department: 'Information Technology (IT / Software)',
    domains: [
      'Full Stack MERN Development',
      'React.js Frontend Developer',
      'Node.js / Express Backend Developer',
      'Flutter Mobile App Developer',
      'Python / AI / Data Analytics',
      'Java / Spring Boot Development'
    ]
  },
  {
    name: 'Quality Assurance & Testing (QA)',
    department: 'Quality Assurance & Testing (QA)',
    domains: [
      'Manual Software Testing',
      'Automation Testing (Selenium / Cypress)',
      'API & Performance Testing (Postman / JMeter)',
      'Security Testing'
    ]
  },
  {
    name: 'UI/UX & Product Design',
    department: 'UI/UX & Product Design',
    domains: [
      'UI/UX Design (Figma / Adobe XD)',
      'Product Design & Prototyping',
      'Graphic & Brand Identity Design',
      'Web & Motion Design'
    ]
  },
  {
    name: 'Human Resources (HR)',
    department: 'Human Resources (HR)',
    domains: [
      'Talent Acquisition & Technical Hiring',
      'HR Operations & Employee Relations',
      'Training & Development'
    ]
  },
  {
    name: 'Business Development & Sales',
    department: 'Business Development & Sales',
    domains: [
      'IT Sales & Client Acquisition',
      'Pre-Sales & Technical Bidding (Upwork / Freelancer)',
      'Account Management'
    ]
  },
  {
    name: 'Digital Marketing',
    department: 'Digital Marketing',
    domains: [
      'SEO / Search Engine Optimization',
      'Performance Marketing & Google Ads',
      'Social Media Management (SMM)'
    ]
  }
];

const initialUsers = [
  {
    name: 'Harsh (Admin)',
    email: 'harsh.kt@gamil.in',
    password: 'kt@123',
    phone: '9876543210',
    role: 'admin',
    designation: 'Operations & HR Head',
    room: 'Admin Office'
  },
  {
    name: 'Harsh (Admin)',
    email: 'harsh.kt@gmail.in',
    password: 'kt@123',
    phone: '9876543210',
    role: 'admin',
    designation: 'Operations & HR Head',
    room: 'Admin Office'
  }
];

async function seedIfEmpty() {
  try {
    const deptCount = await DepartmentModel.countDocuments();
    if (deptCount === 0) {
      for (const dept of initialDepartments) {
        await DepartmentModel.findOneAndUpdate({ name: dept.name }, dept, { upsert: true });
      }
      console.log('🌱 Master departments seeded automatically.');
    }

    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      for (const usr of initialUsers) {
        await UserModel.findOneAndUpdate({ email: usr.email }, usr, { upsert: true });
      }
      console.log('🌱 Default Admin seeded automatically.');
    }
  } catch (err) {
    console.warn('Auto-seed warning:', err.message);
  }
}

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/kevalon_interview';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    await seedIfEmpty();
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
}
