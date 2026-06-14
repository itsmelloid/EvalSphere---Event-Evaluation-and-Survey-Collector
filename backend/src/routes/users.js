const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/',                        authenticate, authorize('admin'), ctrl.getAll);
router.get('/:id',                     authenticate, authorize('admin'), ctrl.getOne);
router.post('/',                       authenticate, authorize('admin'), ctrl.create);
router.put('/:id',                     authenticate, authorize('admin'), ctrl.update);
router.delete('/:id',                  authenticate, authorize('admin'), ctrl.remove);
router.patch('/:id/toggle-status',     authenticate, authorize('admin'), ctrl.toggleStatus);
router.post('/:id/reset-password',     authenticate, authorize('admin'), ctrl.resetPassword);
module.exports = router;
