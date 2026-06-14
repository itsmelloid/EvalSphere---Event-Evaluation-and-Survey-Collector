const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/analytics',     authenticate, authorize('admin','staff'), ctrl.getPlatformAnalytics);
router.get('/export',        authenticate, authorize('admin','staff'), ctrl.exportReport);
router.get('/:id',           authenticate, authorize('admin','staff'), ctrl.getEventReport);

module.exports = router;
