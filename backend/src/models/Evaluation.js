const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evaluation = sequelize.define('Evaluation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  event_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  is_anonymous: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_published: { type: DataTypes.BOOLEAN, defaultValue: false },
  allow_multiple: { type: DataTypes.BOOLEAN, defaultValue: false },
  opens_at: { type: DataTypes.DATE },
  closes_at: { type: DataTypes.DATE },
  created_by: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'evaluations' });

module.exports = Evaluation;
