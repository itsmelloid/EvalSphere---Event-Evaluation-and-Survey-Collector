const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EvaluationQuestion = sequelize.define('EvaluationQuestion', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  evaluation_id: { type: DataTypes.UUID, allowNull: false },
  question_text: { type: DataTypes.TEXT, allowNull: false },
  question_type: { type: DataTypes.ENUM('rating','multiple_choice','yes_no','text','checkbox','dropdown'), allowNull: false },
  options: { type: DataTypes.JSON },
  is_required: { type: DataTypes.BOOLEAN, defaultValue: true },
  order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'evaluation_questions' });

module.exports = EvaluationQuestion;
