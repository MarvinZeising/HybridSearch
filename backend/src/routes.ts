import { Hono } from 'hono';
import newsRoutes from './posts/routes.ts';
import pagesRoutes from './pages/routes.ts';
import usersRoutes from './users/routes.ts';
import branchesRoutes from './branches/routes.ts';

const router = new Hono();

router.route('/news', newsRoutes);
router.route('/pages', pagesRoutes);
router.route('/users', usersRoutes);
router.route('/branches', branchesRoutes);

export default router;
