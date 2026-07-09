const buckets = new Map();

function rateLimit({ windowMs = 60_000, max = 60, keyPrefix = 'default' } = {}) {
  return (req, res, next) => {
    const key = `${keyPrefix}:${req.ip || req.headers['x-forwarded-for'] || 'unknown'}`;
    const now = Date.now();
    const state = buckets.get(key);

    if (!state || state.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (state.count >= max) {
      res.setHeader('Retry-After', Math.ceil((state.resetAt - now) / 1000));
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    state.count += 1;
    return next();
  };
}

module.exports = { rateLimit };
