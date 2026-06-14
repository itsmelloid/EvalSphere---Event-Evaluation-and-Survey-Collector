const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EvaluationAnswer = sequelize.define('EvaluationAnswer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  submission_id: { type: DataTypes.UUID, allowNull: false },
  question_id: { type: DataTypes.UUID, allowNull: false },
  answer_text: { type: DataTypes.TEXT },
  answer_rating: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
  answer_options: { type: DataTypes.JSON },
}, { tableName: 'evaluation_answers' });

module.exports = EvaluationAnswer;
