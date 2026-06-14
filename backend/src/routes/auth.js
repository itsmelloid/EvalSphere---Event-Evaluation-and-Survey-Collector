const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, ctrl.register);
router.post('/login',    authLimiter, ctrl.login);
router.post('/logout',   authenticate, ctrl.logout);
router.post('/refresh',  ctrl.refreshToken);
router.get('/profile',   authenticate, ctrl.getProfile);
router.put('/profile',   authenticate, ctrl.updateProfile);
router.put('/password',  authenticate, ctrl.changePassword);
module.exports = router;
