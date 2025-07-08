import express from 'express';
import newsRoutes from './posts/routes.js';
import pagesRoutes from './pages/routes.js';
import usersRoutes from './users/routes.js';
import branchesRoutes from './branches/routes.js';

const router = express.Router();

router.use('/news', newsRoutes);
router.use('/pages', pagesRoutes);
router.use('/users', usersRoutes);
router.use('/branches', branchesRoutes);

export default router;
