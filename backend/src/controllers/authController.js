const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const jwtConfig = require('../config/jwt');
const { User } = require('../models');
const { success, error } = require('../utils/response');
const { sendEmail, emailTemplates } = require('../utils/email');

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
  const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpiresIn });
  return { accessToken, refreshToken };
};

// Helper to sanitize user object for response
const sanitizeUser = (user) => {
  const u = typeof user.get === 'function' ? user.get({ plain: true }) : { ...user };
  delete u.password;
  delete u.refresh_token;
  return u;
};

exports.register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone, organization, department } = req.body;
    const exists = await User.findOne({ where: { email } });
    if (exists) return error(res, 'Email already registered.', 409);
    const user = await User.create({ first_name, last_name, email, password, phone, organization, department });
    const { accessToken, refreshToken } = generateTokens(user);
    await user.update({ refresh_token: refreshToken, last_login: new Date() });
    const tmpl = emailTemplates.welcome(`${first_name} ${last_name}`);
    sendEmail({ to: email, ...tmpl });
    return success(res, { user: sanitizeUser(user), accessToken, refreshToken }, 'Registration successful.', 201);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password are required.', 400);
    const user = await User.findOne({ where: { email } });
    if (!user || !user.is_active) return error(res, 'Invalid credentials or account disabled.', 401);
    const valid = await user.validatePassword(password);
    if (!valid) return error(res, 'Invalid credentials.', 401);
    const { accessToken, refreshToken } = generateTokens(user);
    await user.update({ refresh_token: refreshToken, last_login: new Date() });
    return success(res, { user: sanitizeUser(user), accessToken, refreshToken }, 'Login successful.');
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    await req.user.update({ refresh_token: null });
    return success(res, null, 'Logged out successfully.');
  } catch (err) { next(err); }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token required.', 400);
    const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
    const user = await User.findByPk(decoded.id);
    if (!user || user.refresh_token !== refreshToken) return error(res, 'Invalid refresh token.', 401);
    const tokens = generateTokens(user);
    await user.update({ refresh_token: tokens.refreshToken });
    return success(res, tokens, 'Token refreshed.');
  } catch (err) { next(err); }
};

exports.getProfile = async (req, res, next) => {
  try {
    if (!req.user) return error(res, 'User not found.', 404);
    return success(res, sanitizeUser(req.user), 'Profile fetched.');
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, organization, department } = req.body;
    const user = await User.findByPk(req.user.id);
    await user.update({ first_name, last_name, phone, organization, department });
    return success(res, sanitizeUser(user), 'Profile updated.');
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findByPk(req.user.id);
    const valid = await user.validatePassword(current_password);
    if (!valid) return error(res, 'Current password is incorrect.', 400);
    await user.update({ password: new_password });
    return success(res, null, 'Password changed successfully.');
  } catch (err) { next(err); }
};
