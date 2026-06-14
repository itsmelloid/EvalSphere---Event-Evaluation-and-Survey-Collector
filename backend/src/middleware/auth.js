const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { User } = require('../models');
const { error } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Access denied. No token provided.', 401);
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refresh_token'] },
    });
    if (!user || !user.is_active) {
      return error(res, 'Account not found or deactivated.', 401);
    }
    req.user = user;
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token.', 401);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return error(res, 'Access denied. Insufficient permissions.', 403);
  }
  next();
};

module.exports = { authenticate, authorize };
