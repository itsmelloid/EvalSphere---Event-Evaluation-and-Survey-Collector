const router = require('express').Router();
const ctrl = require('../controllers/evaluationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/event/:eventId',     authenticate, ctrl.getByEvent);
router.get('/:id',                authenticate, ctrl.getOne);
router.get('/:id/responses',      authenticate, authorize('admin','staff'), ctrl.getResponses);
// analytics endpoint removed
router.get('/:id/qr',             authenticate, authorize('admin','staff'), ctrl.getQR);
router.get('/:id/has-submitted',  authenticate, ctrl.hasSubmitted);
router.post('/',                  authenticate, authorize('admin','staff'), ctrl.create);
router.put('/:id',                authenticate, authorize('admin','staff'), ctrl.update);
router.patch('/:id/publish',      authenticate, authorize('admin','staff'), ctrl.publish);
router.post('/submit',            authenticate, ctrl.submit);
module.exports = router;
