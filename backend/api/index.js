require('dotenv').config();

const app = require('../src/app');
const { sequelize } = require('../src/models');
const logger = require('../src/utils/logger');

let initialized = false;
let initPromise = null;

async function initialize() {
  if (initialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await sequelize.authenticate();
        logger.info('Database connection established successfully.');
        await sequelize.sync();
        logger.info('Database synchronized.');
        initialized = true;
      } catch (error) {
        logger.error('Unable to initialize serverless handler:', error);
        throw error;
      } finally {
        initPromise = null;
      }
    })();
  }

  return initPromise;
}

module.exports = async (req, res) => {
  await initialize();
  return app(req, res);
};
