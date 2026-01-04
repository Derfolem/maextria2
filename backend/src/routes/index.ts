import { Router } from 'express';
import authRoutes from './auth';
import usersRoutes from './users';
import coursesRoutes from './courses';
import modulesRoutes from './modules';
import enrollmentsRoutes from './enrollments';
import categoriesRoutes from './categories';
import certificatesRoutes from './certificates';
import dashboardRoutes from './dashboard';
import aiRoutes from './ai';
import settingsRoutes from './settings';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/courses', coursesRoutes);
router.use('/modules', modulesRoutes);
router.use('/enrollments', enrollmentsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/certificates', certificatesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/ai', aiRoutes);
router.use('/settings', settingsRoutes);

export default router;
