import express from 'express';
import { getDepartments, createOrUpdateDepartment } from '../controllers/departmentController.js';

const router = express.Router();

router.get('/', getDepartments);
router.post('/', createOrUpdateDepartment);

export default router;
