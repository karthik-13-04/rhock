import jwt from 'jsonwebtoken';

/**
 * Generates a JSON Web Token (JWT)
 * @param {Object} payload - Data to encode in the token
 * @returns {string} Signed JWT
 */
export function generateToken(payload) {
  const secret = process.env.JWT_SECRET || 'fallback_dev_secret';
  const expiresIn = process.env.JWT_EXPIRY || '7d';
  
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verifies a JWT
 * @param {string} token 
 * @returns {Object} Decoded payload
 */
export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'fallback_dev_secret';
  return jwt.verify(token, secret);
}
