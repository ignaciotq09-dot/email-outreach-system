import { Router } from 'express';
import gmailRoutes from './gmail';
import outlookRoutes from './outlook';
import yahooRoutes from './yahoo';
import statusRoutes from './status';

const router = Router();

router.use('/gmail', gmailRoutes);
router.use('/outlook', outlookRoutes);
router.use('/yahoo', yahooRoutes);
router.use('/', statusRoutes);

export default router;
