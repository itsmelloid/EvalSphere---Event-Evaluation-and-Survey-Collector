const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventAttendee = sequelize.define('EventAttendee', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  event_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: false },
  registered_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  attended: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'event_attendees' });

module.exports = EventAttendee;
