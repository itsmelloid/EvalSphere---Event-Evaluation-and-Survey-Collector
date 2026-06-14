module.exports = {
  secret: process.env.JWT_SECRET || 'evalsphere_dev_secret_change_in_prod',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'evalsphere_refresh_dev_secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
