const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  venue: { type: DataTypes.STRING(500), allowNull: false },
  event_date: { type: DataTypes.DATEONLY, allowNull: false },
  start_time: { type: DataTypes.TIME },
  end_time: { type: DataTypes.TIME },
  organizer: { type: DataTypes.STRING(255) },
  category: { type: DataTypes.ENUM('Technology','Education','Training','Health','Finance','Marketing','HR','Operations','Other'), defaultValue: 'Other' },
  image: { type: DataTypes.STRING(500) },
  max_participants: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('Upcoming','Ongoing','Completed','Cancelled','Archived'), defaultValue: 'Upcoming' },
  approval_status: { type: DataTypes.ENUM('Pending','Approved','Rejected'), defaultValue: 'Pending' },
  is_public: { type: DataTypes.BOOLEAN, defaultValue: true },
  published_at: { type: DataTypes.DATE },
  created_by: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'events' });

module.exports = Event;
