const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { User, Event, Submission, Evaluation } = require('../models');
const { success } = require('../utils/response');
const { Sequelize } = require('sequelize');

router.get('/dashboard', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [users, staff, events, submissions, evaluations] = await Promise.all([
      User.count({ where: { role: 'user' } }),
      User.count({ where: { role: 'staff' } }),
      Event.count(),
      Submission.count(),
      Evaluation.count(),
    ]);
    const avgRating = await Submission.findOne({
      attributes: [[Sequelize.fn('AVG', Sequelize.col('average_rating')), 'avg']],
      raw: true,
    });
    return success(res, { users, staff, events, submissions, evaluations, avg_rating: avgRating?.avg ? parseFloat(avgRating.avg).toFixed(2) : null });
  } catch (err) { next(err); }
});
module.exports = router;
