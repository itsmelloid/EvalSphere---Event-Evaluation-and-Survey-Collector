const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  first_name: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true } },
  last_name: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true } },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'staff', 'user'), defaultValue: 'user' },
  phone: { type: DataTypes.STRING(20) },
  organization: { type: DataTypes.STRING(255) },
  department: { type: DataTypes.STRING(255) },
  avatar: { type: DataTypes.STRING(500) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  refresh_token: { type: DataTypes.TEXT },
  last_login: { type: DataTypes.DATE },
  email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) user.password = await bcrypt.hash(user.password, 12);
    },
  },
});

User.prototype.validatePassword = async function(plain) {
  return bcrypt.compare(plain, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.refresh_token;
  return values;
};

module.exports = User;
