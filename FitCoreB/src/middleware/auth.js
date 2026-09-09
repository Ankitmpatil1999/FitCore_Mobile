/**
 * FitCore — JWT Authentication & Role Guard Middleware
 *
 * Usage:
 *   verifyToken            — validates JWT from Authorization header
 *   requireRole(...roles)  — checks req.user.role against allowed roles
 *
 * Attach in routes.js:
 *   router.get('/secret', verifyToken, requireRole('admin','super_admin'), handler)
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('🚨 CRITICAL: JWT_SECRET is not set in environment variables! Using insecure fallback.');
}

const SECRET = JWT_SECRET || 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_IN_PRODUCTION';

/**
 * verifyToken — Extracts and validates JWT from Authorization: Bearer <token> header.
 * Sets req.user = { id, role } on success.
 */
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Authentication token is required.',
    });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please login again.',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid token. Please login again.',
    });
  }
};

/**
 * requireRole(...roles) — Role-based access control guard.
 * Must be used AFTER verifyToken.
 *
 * Example: requireRole('super_admin', 'admin')
 */
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
    });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: `Access denied. This action requires: ${roles.join(' or ')}.`,
    });
  }
  next();
};

/**
 * optionalAuth — Attaches req.user if token present, but doesn't block if missing.
 * Useful for public routes that behave differently for logged-in users.
 */
exports.optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = { id: decoded.id, role: decoded.role };
  } catch {
    // Invalid token — proceed as unauthenticated
    req.user = null;
  }
  next();
};
