// Rate limiting disabled: export no-op middleware so routes that import
// `generalLimiter` or `authLimiter` continue to work without changing
// route definitions. To re-enable rate limiting, replace these with real
// express-rate-limit configs.

function noopLimiter(req, res, next) {
  return next();
}

module.exports = { generalLimiter: noopLimiter, authLimiter: noopLimiter };
