const router = require('express').Router();
const ctrl = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/',           authenticate, ctrl.getAll);
router.get('/:id',        authenticate, ctrl.getOne);
router.get('/:id/stats',  authenticate, ctrl.getStats);
router.get('/:id/qr',     authenticate, authorize('admin','staff'), ctrl.getQR);
router.post('/',          authenticate, authorize('admin','staff'), upload.single('image'), ctrl.create);
router.patch('/:id/approval', authenticate, authorize('admin'), ctrl.reviewApproval);
router.put('/:id',        authenticate, authorize('admin','staff'), upload.single('image'), ctrl.update);
router.delete('/:id',     authenticate, authorize('admin','staff'), ctrl.remove);
router.post('/:id/register', authenticate, authorize('user'), ctrl.registerAttendee);
module.exports = router;
