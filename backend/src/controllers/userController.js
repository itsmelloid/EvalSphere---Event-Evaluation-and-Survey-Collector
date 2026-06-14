const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { User, Submission, EventAttendee } = require('../models');
const { success, error } = require('../utils/response');
const { sendEmail, emailTemplates } = require('../utils/email');
const { v4: uuidv4 } = require('uuid');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, is_active } = req.query;
    const where = {};
    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (search) where[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name:  { [Op.like]: `%${search}%` } },
      { email:      { [Op.like]: `%${search}%` } },
    ];
    const { count, rows } = await User.findAndCountAll({
      where, limit: parseInt(limit), offset: (page - 1) * limit,
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password', 'refresh_token'] },
    });
    return success(res, { users: rows, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password', 'refresh_token'] } });
    if (!user) return error(res, 'User not found.', 404);
    const submissionCount = await Submission.count({ where: { user_id: user.id } });
    const attendedCount   = await EventAttendee.count({ where: { user_id: user.id } });
    return success(res, { ...user.toJSON(), submission_count: submissionCount, attended_events: attendedCount });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, role, phone, organization, department } = req.body;
    const exists = await User.findOne({ where: { email } });
    if (exists) return error(res, 'Email already registered.', 409);
    const user = await User.create({ first_name, last_name, email, password, role, phone, organization, department });
    const tmpl = emailTemplates.welcome(`${first_name} ${last_name}`);
    sendEmail({ to: email, ...tmpl });
    return success(res, user, 'User created.', 201);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, 'User not found.', 404);
    const data = { ...req.body };
    if (typeof data.password === 'string') data.password = data.password.trim();
    if (!data.password) delete data.password;
    await user.update(data);
    return success(res, user, 'User updated.');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, 'User not found.', 404);
    if (user.role === 'admin') return error(res, 'Cannot delete admin accounts.', 403);
    await user.destroy();
    return success(res, null, 'User deleted.');
  } catch (err) { next(err); }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, 'User not found.', 404);
    await user.update({ is_active: !user.is_active });
    return success(res, user, `User ${user.is_active ? 'activated' : 'deactivated'}.`);
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, 'User not found.', 404);
    const tempPassword = uuidv4().substring(0, 10);
    await user.update({ password: tempPassword });
    const tmpl = emailTemplates.passwordReset(`${user.first_name} ${user.last_name}`, tempPassword);
    sendEmail({ to: user.email, ...tmpl }); // Consider if you still want to send this email without logging.
    return success(res, null, 'Password reset. Email sent to user.');
  } catch (err) { next(err); }
};
