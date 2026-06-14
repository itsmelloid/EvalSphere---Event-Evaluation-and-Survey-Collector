const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const databaseName =
  process.env.DB_NAME ||
  process.env.MYSQLDATABASE ||
  process.env.MYSQL_DATABASE ||
  'evalsphere_db';

const databaseUser =
  process.env.DB_USER ||
  process.env.MYSQLUSER ||
  'root';

const databasePassword =
  process.env.DB_PASSWORD ||
  process.env.MYSQLPASSWORD ||
  '';

const databaseHost =
  process.env.DB_HOST ||
  process.env.MYSQLHOST ||
  'localhost';

const databasePort =
  process.env.DB_PORT ||
  process.env.MYSQLPORT ||
  3306;

const sequelize = new Sequelize(
  databaseName,
  databaseUser,
  databasePassword,
  {
    host: databaseHost,
    port: parseInt(databasePort, 10) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (sql) => logger.debug(sql) : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: { underscored: true, timestamps: true, paranoid: true },
  }
);

module.exports = sequelize;
