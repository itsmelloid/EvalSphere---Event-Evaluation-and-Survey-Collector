const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Submission = sequelize.define('Submission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  evaluation_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID },
  average_rating: { type: DataTypes.DECIMAL(3,2) },
  submitted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  ip_address: { type: DataTypes.STRING(45) },
}, { tableName: 'submissions' });

module.exports = Submission;
