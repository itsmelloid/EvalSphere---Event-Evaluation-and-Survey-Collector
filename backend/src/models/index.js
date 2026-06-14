const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const Evaluation = require('./Evaluation');
const EvaluationQuestion = require('./EvaluationQuestion');
const EvaluationAnswer = require('./EvaluationAnswer');
const Submission = require('./Submission');
const EventAttendee = require('./EventAttendee');
// Notification and ActivityLog models removed

// Associations
User.hasMany(Event, { foreignKey: 'created_by', as: 'events' });
Event.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Event.hasOne(Evaluation, { foreignKey: 'event_id', as: 'evaluation' });
Evaluation.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Evaluation.hasMany(EvaluationQuestion, { foreignKey: 'evaluation_id', as: 'questions' });
EvaluationQuestion.belongsTo(Evaluation, { foreignKey: 'evaluation_id' });

Evaluation.hasMany(Submission, { foreignKey: 'evaluation_id', as: 'submissions' });
Submission.belongsTo(Evaluation, { foreignKey: 'evaluation_id' });
Submission.belongsTo(User, { foreignKey: 'user_id', as: 'respondent' });
User.hasMany(Submission, { foreignKey: 'user_id', as: 'submissions' });

Submission.hasMany(EvaluationAnswer, { foreignKey: 'submission_id', as: 'answers' });
EvaluationAnswer.belongsTo(Submission, { foreignKey: 'submission_id' });
EvaluationAnswer.belongsTo(EvaluationQuestion, { foreignKey: 'question_id', as: 'question' });

Event.hasMany(EventAttendee, { foreignKey: 'event_id', as: 'attendees' });
EventAttendee.belongsTo(Event, { foreignKey: 'event_id' });
EventAttendee.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Notifications and activity logs removed from associations

module.exports = {
  sequelize,
  User, Event, Evaluation, EvaluationQuestion,
  EvaluationAnswer, Submission, EventAttendee,
  // Notification, ActivityLog removed
};
